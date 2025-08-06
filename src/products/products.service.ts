import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorHandlerService } from 'src/common/services/error-handler/error-handler.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';
import { Product, ProductImage } from './entities';

@Injectable()
export class ProductsService {

  constructor(
    @InjectRepository(Product)
    private readonly productRespository: Repository<Product>,
    private readonly errorHandleService: ErrorHandlerService,

    @InjectRepository(ProductImage)
    private readonly productImageRespository: Repository<ProductImage>,

    private readonly dataSource: DataSource
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto; 
      const product = this.productRespository.create({
        ...createProductDto,
        images: images.map( image => this.productImageRespository.create({ url: image }) )
      });

      await this.productRespository.save( product );

      return { ...product, images };
    } catch (error) {
      this.errorHandleService.errorHandle(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productRespository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });
    
    return products.map(product => ({
      ...product,
      images: product.images.map(img => img.url)
    }));
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRespository.findOneBy({ id: term })
    } else {
      const queryBuilder = this.productRespository.createQueryBuilder('prod');
      product = await queryBuilder
        .where('LOWER(title) =:title or slug =:slug', { 
          title: term.toLowerCase().trim(), 
          slug: term.toLowerCase().trim()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with ${ term } not found`);

    return product;
  }

  async findOnePlain(term: string) {
    const { images = [], ...product } = await this.findOne(term);
    return {
      ...product,
      images: images.map( image => image.url )
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto

    const product = await this.productRespository.preload({ id, ...toUpdate });

    if (!product)
      throw new NotFoundException(`Product with id ${ id } not found`);

    //Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    // Connect
    await queryRunner.connect();
    // Init transaction
    await queryRunner.startTransaction();

    try {

      if ( images ) {
        // delete by criteria with QueryRunner
        await queryRunner.manager.delete( ProductImage, { product: { id } } );

        product.images = images.map(
          image => this.productImageRespository.create({ url: image })
        );
      }

      await queryRunner.manager.save( product );
      await queryRunner.commitTransaction();
      return this.findOnePlain(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      this.errorHandleService.errorHandle(error);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRespository.remove(product);
    return { eliminated: true };
  }

  async deleteAllProducts() {
    const query = this.productRespository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.errorHandleService.errorHandle(error);
    }
  }
}

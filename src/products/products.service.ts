import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ErrorHandlerService } from 'src/common/services/error-handler/error-handler.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {

  constructor(
    @InjectRepository(Product)
    private readonly productRespository: Repository<Product>,
    private readonly errorHandleService: ErrorHandlerService
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRespository.create(createProductDto);
      await this.productRespository.save( product );

      return product;
    } catch (error) {
      this.errorHandleService.errorHandle(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = this.productRespository.find({
      take: limit,
      skip: offset
      // TODO relations
    });
    return products;
  }

  async findOne(term: string) {

    let product: Product;

    if (isUUID(term)) {
      product = await this.productRespository.findOneBy({ id: term })
    } else {
      const queryBuilder = this.productRespository.createQueryBuilder();
      product = await queryBuilder
        .where('LOWER(title) =:title or slug =:slug', { 
          title: term.toLowerCase().trim(), 
          slug: term.toLowerCase().trim()
        }).getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with ${ term } not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRespository.preload({
      id,
      ...updateProductDto
    });

    if (!product)
      throw new NotFoundException(`Product with id ${ id } not found`);

    try {
      await this.productRespository.save(product);
      return product; 
    } catch (error) {
      this.errorHandleService.errorHandle(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRespository.remove(product);
    return { eliminated: true };
  }
}

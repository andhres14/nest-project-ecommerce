import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CommonModule } from 'src/common/common.module';
import { Product, ProductImage } from './entities';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([ Product, ProductImage ]),
    CommonModule,
    AuthModule
  ],
  controllers: [ ProductsController ],
  providers: [ ProductsService ],
  exports: [ 
    ProductsService,
    TypeOrmModule
  ]
})
export class ProductsModule {}

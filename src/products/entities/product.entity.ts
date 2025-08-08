import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductImage } from "./product-image.entity";
import { User } from "src/auth/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity({ name: 'products' })
export class Product {

    @ApiProperty({ 
        example: '1b512507-9004-456c-8e3a-6a133b154a9d',
        description: 'Product ID',
        uniqueItems: true
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ 
        example: 'Polo Camisa',
        description: 'Product Title',
        uniqueItems: true
    })
    @Column('text', { unique: true })
    title: string;

    @ApiProperty({ 
        example: '0',
        description: 'Product Price'
    })
    @Column('float', { default: 0 })
    price: number;

    @ApiProperty({ 
        example: 'Fugiat officia qui velit amet irure laboris.',
        description: 'Product Description',
        default: null
    })
    @Column({ type: 'text', nullable: true })
    description: string;

    @ApiProperty({ 
        example: 'polo_camisa',
        description: 'Product Slug - for SEO',
        uniqueItems: true
    })
    @Column('text', { unique: true })
    slug: string;

    @ApiProperty({ 
        example: 10,
        description: 'Product Stock',
        default: 0
    })
    @Column('int', { default: 0 })
    stock: number;

    @ApiProperty({ 
        example: ['M', 'XL'],
        description: 'Product Sizes'
    })
    @Column('text', { array: true })
    sizes: string[]

    @ApiProperty({ 
        example: 'women',
        description: 'Product Gender'
    })
    @Column('text')
    gender: string;

    @ApiProperty({ 
        example: ['polo','camisa','promocion'],
        description: 'Product ID',
        default: []
    })
    @Column('text', { array: true, default: [] })
    tags: string[]

    @ApiProperty({ 
        example: ['https://image1.png', 'https://image2.png'],
        description: 'Product Images'
    })
    @OneToMany(
        () => ProductImage,
        productImage => productImage.product,
        { cascade: true, eager: true }
    )
    images?: ProductImage[]

    @ManyToOne(
        () => User,
        ( user ) => user.product,
        { eager: true }
    )
    user: User;

    @BeforeInsert()
    checkSlugInsert() {
        if (!this.slug) {
            this.slug = this.title;
        }

        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }

    @BeforeUpdate()
    checkSlugUpdate() {
        this.slug = this.slug
            .toLowerCase()
            .replaceAll(' ', '_')
            .replaceAll("'", '')
    }
}

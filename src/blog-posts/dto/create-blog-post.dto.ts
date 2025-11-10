import { IsNotEmpty, IsOptional, IsArray, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlogPostDto {
  @ApiProperty({
    description: 'Title of the blog post',
    example: 'Getting Started with NestJS and Swagger',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Content of the blog post',
    example: 'This is a comprehensive guide on documenting NestJS APIs with Swagger...',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  image_urls?: string[];

  @ApiPropertyOptional({
    description: 'Array of video URLs',
    example: ['https://example.com/video1.mp4'],
    type: [String],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  video_urls?: string[];
}
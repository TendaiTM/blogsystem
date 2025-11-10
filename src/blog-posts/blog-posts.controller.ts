import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    UseGuards, 
    Request,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
    HttpStatus,
    HttpCode
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiParam 
} from '@nestjs/swagger';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('blog-posts')
@ApiBearerAuth('JWT-auth')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Create a new blog post',
    description: 'Create a blog post with text content only'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Blog post created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async create(@Body() createBlogPostDto: CreateBlogPostDto, @Request() req: any) {
    const authorId = req.user.id;
    if (!authorId) {
      throw new BadRequestException('User authentication failed - no user ID in token');
    }
    return this.blogPostsService.create(createBlogPostDto, authorId);
  }

  @Post('with-media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ 
    summary: 'Create blog post with media files',
    description: 'Upload images/videos and create a blog post in one request'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Create blog post with uploaded files',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of image/video files (max 10 files)',
        },
        title: { 
          type: 'string', 
          example: 'My Blog Post with Media',
          description: 'Post title'
        },
        content: { 
          type: 'string', 
          example: 'This is a blog post with embedded media files...',
          description: 'Post content'
        },
      },
      required: ['title', 'content', 'files'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Blog post with media created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'No files uploaded or invalid data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async createWithMedia(
    @Body() createBlogPostDto: CreateBlogPostDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ) {
    const authorId = req.user.id;
    if (!authorId) {
      throw new BadRequestException('User authentication failed - no user ID in token');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const { imageUrls, videoUrls } = await this.blogPostsService.uploadFilesToSupabase(files);
    const postWithMedia = {
      ...createBlogPostDto,
      image_urls: imageUrls,
      video_urls: videoUrls,
    };

    return this.blogPostsService.create(postWithMedia, authorId);
  }

  @Put(':id/media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ 
    summary: 'Add media to existing blog post',
    description: 'Upload and attach additional media files to an existing blog post'
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ 
    name: 'id', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: 'Files to upload and attach to blog post',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of image/video files (max 10 files)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Media added to post successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Blog post not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only modify their own posts' 
  })
  async addMediaToPost(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const { imageUrls, videoUrls } = await this.blogPostsService.uploadFilesToSupabase(files);
    return this.blogPostsService.addMediaToPost(id, req.user.id, imageUrls, videoUrls);
  }

  @Delete(':id/media')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Remove media from blog post',
    description: 'Remove specific image or video URLs from a blog post'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: 'Media URLs to remove',
    schema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'Image URL to remove (optional)',
          example: 'https://example.com/image1.jpg',
          nullable: true
        },
        videoUrl: {
          type: 'string',
          description: 'Video URL to remove (optional)',
          example: 'https://example.com/video1.mp4',
          nullable: true
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Media removed successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Blog post not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only modify their own posts' 
  })
  async removeMediaFromPost(
    @Param('id') id: string,
    @Body() body: { imageUrl?: string; videoUrl?: string },
    @Request() req: any
  ) {
    return this.blogPostsService.removeMediaFromPost(id, req.user.id, body.imageUrl, body.videoUrl);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all blog posts',
    description: 'Retrieve all blog posts with author information and comment counts'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all blog posts' 
  })
  async findAll() {
    return this.blogPostsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get blog post by ID',
    description: 'Retrieve a specific blog post with full details including comments'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns the blog post' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Blog post not found' 
  })
  async findOne(@Param('id') id: string) {
    return this.blogPostsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Update blog post',
    description: 'Update text content of a blog post'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Blog post updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Blog post not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only update their own posts' 
  })
  async update(
    @Param('id') id: string, 
    @Body() updateData: Partial<CreateBlogPostDto>, 
    @Request() req: any
  ) {
    return this.blogPostsService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete blog post',
    description: 'Permanently delete a blog post and its associated media'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Blog post deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Blog post not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only delete their own posts' 
  })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.blogPostsService.remove(id, req.user.id);
  }

  @Get('user/my-posts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get current user posts',
    description: 'Retrieve all blog posts created by the authenticated user'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns user posts' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async findMyPosts(@Request() req: any) {
    return this.blogPostsService.findByAuthor(req.user.id);
  }
}
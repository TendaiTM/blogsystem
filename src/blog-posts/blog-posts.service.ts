import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateBlogPostDto } from './dto/create-blog-post.dto.js';

@Injectable()
export class BlogPostsService {
  constructor(private supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.createBlogMediaBucket();
  }

  private async createBlogMediaBucket(): Promise<void> {
    const supabaseClient = this.supabaseService.getClient();

    try {
      const {data,error} = await supabaseClient.storage.createBucket('blog-media',{
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 52428800,
      });

      if (error) {
        if (error.message.includes('already exists')) {
          console.log('blog-media bucket already exists');
          return;
        }
        console.error('Error creating bucket:', error);
        throw new BadRequestException(`Failed to create storage bucket: ${error.message}`)
      } else {
        console.log('Blog-media bucket created successfully')
      }
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('Blog-media bucket already exists');
        return;
      }
      console.error('Unexpected error during bucket creation', error);
    }
  }

  async create(createBlogPostDto: CreateBlogPostDto, authorId: string): Promise<any> {
    try {
      const { data: post, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .insert([{
          ...createBlogPostDto,
          author_id: authorId,
        }])
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to create post: ${error.message}`);
      }

      return post;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create blog post');
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const { data: posts, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select(`
          *,
          author:users(id, name, surname, username, email),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch posts: ${error.message}`);
      }

      return posts || [];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch blog posts');
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const { data: post, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select(`
          *,
          author:users(id, name, surname, username, email),
          comments:comments(*, author:users(id, name, surname, username, email))
        `)
        .eq('id', id)
        .single();

      if (error || !post) {
        throw new NotFoundException('Blog post not found');
      }

      return post;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch blog post');
    }
  }

  async update(id: string, updateData: Partial<CreateBlogPostDto>, userId: string): Promise<any> {
    try {
      // First check if post exists and user is author
      const { data: existingPost, error: checkError } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select('author_id')
        .eq('id', id)
        .single();

      if (checkError || !existingPost) {
        throw new NotFoundException('Blog post not found');
      }

      if (existingPost.author_id !== userId) {
        throw new ForbiddenException('You can only update your own posts');
      }

      const { data: updatedPost, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to update post: ${error.message}`);
      }

      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update blog post');
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      // First check if post exists and user is author
      const { data: existingPost, error: checkError } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select('author_id')
        .eq('id', id)
        .single();

      if (checkError || !existingPost) {
        throw new NotFoundException('Blog post not found');
      }

      if (existingPost.author_id !== userId) {
        throw new ForbiddenException('You can only delete your own posts');
      }

      const { error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new BadRequestException(`Failed to delete post: ${error.message}`);
      }

      return { message: 'Blog post deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete blog post');
    }
  }

  async findByAuthor(authorId: string): Promise<any[]> {
    try {
      const { data: posts, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch user posts: ${error.message}`);
      }

      return posts || [];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user blog posts');
    }
  }

  async uploadFilesToSupabase(files: Express.Multer.File[]): Promise<{ imageUrls: string[], videoUrls: string[] }> {
    const supabaseClient = this.supabaseService.getClient();
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided for upload');
      }

      console.log('using blog-media bucket for upload');

      for (const file of files) {
        console.log(`📄 Processing file: ${file.originalname}, size: ${file.size} bytes, type: ${file.mimetype}`);
      
        // Validate file
        if (!file.buffer || file.size === 0) {
          console.error('❌ File buffer is empty or file size is 0');
          throw new BadRequestException(`File ${file.originalname} is empty or corrupted`);
        }

        const fileExtension = file.originalname.split('.').pop() || 'file';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        
        const filePath = file.mimetype.startsWith('image/')
          ? `images/${fileName}`
          : file.mimetype.startsWith('video/')
            ? `videos/${fileName}`
            : `other/${fileName}`;

        const { data, error } = await supabaseClient.storage
          .from('blog-media') // Make sure this bucket exists in your Supabase storage
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (error) {
          console.error(' Supabase upload error:', {
            message: error.message,
            name: error.name,
            stack: error.stack
          });
          throw new BadRequestException(`Failed to upload file: ${file.originalname}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('blog-media')
          .getPublicUrl(filePath);

        if (file.mimetype.startsWith('image/')) {
          imageUrls.push(publicUrl);
        } else if (file.mimetype.startsWith('video/')) {
          videoUrls.push(publicUrl);
        } else {
          console.warn('⚠️ Unknown file type, skipping:', file.mimetype);
        }
      }

      console.log('✅ All files uploaded successfully. Images:', imageUrls.length, 'Videos:', videoUrls.length);
      return { imageUrls, videoUrls };
    } catch (error) {
      console.error('❌ Error in file upload process:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Convert other errors to BadRequestException
      throw new BadRequestException(`Failed to upload files: ${error.message}`);
      }
  }

  async addMediaToPost(
    postId: string, 
    userId: string, 
    imageUrls: string[] = [], 
    videoUrls: string[] = []
  ): Promise<any> {
    try {
      // First check if post exists and user is author
      const { data: existingPost, error: checkError } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select('author_id, image_urls, video_urls')
        .eq('id', postId)
        .single();

      if (checkError || !existingPost) {
        throw new NotFoundException('Blog post not found');
      }

      if (existingPost.author_id !== userId) {
        throw new ForbiddenException('You can only modify your own posts');
      }

      // Merge existing media with new media
      const updatedImageUrls = [...(existingPost.image_urls || []), ...imageUrls];
      const updatedVideoUrls = [...(existingPost.video_urls || []), ...videoUrls];

      // Update the post with new media URLs
      const { data: updatedPost, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .update({
          image_urls: updatedImageUrls,
          video_urls: updatedVideoUrls,
        })
        .eq('id', postId)
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to add media to post: ${error.message}`);
      }

      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to add media to blog post');
    }
  }

  async removeMediaFromPost(
    postId: string, 
    userId: string, 
    imageUrl?: string, 
    videoUrl?: string
  ): Promise<any> {
    try {
      // First check if post exists and user is author
      const { data: existingPost, error: checkError } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select('author_id, image_urls, video_urls')
        .eq('id', postId)
        .single();

      if (checkError || !existingPost) {
        throw new NotFoundException('Blog post not found');
      }

      if (existingPost.author_id !== userId) {
        throw new ForbiddenException('You can only modify your own posts');
      }

      let updatedImageUrls = existingPost.image_urls || [];
      let updatedVideoUrls = existingPost.video_urls || [];

      // Remove specific image URL if provided
      if (imageUrl) {
        updatedImageUrls = updatedImageUrls.filter(url => url !== imageUrl);
        
        // Optional: Delete file from Supabase Storage
        if (imageUrl.includes('supabase.co')) {
          const supabaseClient = this.supabaseService.getClient();
          const fileName = imageUrl.split('/').pop();
          if (fileName) {
            await supabaseClient.storage
              .from('blog-media')
              .remove([`images/${fileName}`]);
          }
        }
      }

      // Remove specific video URL if provided
      if (videoUrl) {
        updatedVideoUrls = updatedVideoUrls.filter(url => url !== videoUrl);
        
        // Optional: Delete file from Supabase Storage
        if (videoUrl.includes('supabase.co')) {
          const supabaseClient = this.supabaseService.getClient();
          const fileName = videoUrl.split('/').pop();
          if (fileName) {
            await supabaseClient.storage
              .from('blog-media')
              .remove([`videos/${fileName}`]);
          }
        }
      }

      // Update the post with filtered media URLs
      const { data: updatedPost, error } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .update({
          image_urls: updatedImageUrls,
          video_urls: updatedVideoUrls,
        })
        .eq('id', postId)
        .select(`
          *,
          author:users(author_id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to remove media from post: ${error.message}`);
      }

      return updatedPost;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to remove media from blog post');
    }
  }

}
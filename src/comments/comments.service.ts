import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private supabaseService: SupabaseService, // ✅ Use Supabase instead of TypeORM
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string): Promise<any> {
    try {
      // First, check if the blog post exists
      const { data: post, error: postError } = await this.supabaseService
        .getClient()
        .from('blog_posts')
        .select('id')
        .eq('id', createCommentDto.post_id)
        .single();

      if (postError || !post) {
        throw new NotFoundException('Blog post not found');
      }

      // Create the comment
      const { data: comment, error } = await this.supabaseService
        .getClient()
        .from('comments')
        .insert([{
          ...createCommentDto,
          author_id: authorId,
        }])
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to create comment: ${error.message}`);
      }

      return comment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create comment');
    }
  }

  async getCommentsByPost(postId: string): Promise<any[]> {
    try {
      const { data: comments, error } = await this.supabaseService
        .getClient()
        .from('comments')
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new BadRequestException(`Failed to fetch comments: ${error.message}`);
      }

      return comments || [];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch comments');
    }
  }

  async update(id: string, content: string, userId: string): Promise<any> {
    try {
      // First, check if comment exists and user is author
      const { data: existingComment, error: checkError } = await this.supabaseService
        .getClient()
        .from('comments')
        .select('author_id')
        .eq('id', id)
        .single();

      if (checkError || !existingComment) {
        throw new NotFoundException('Comment not found');
      }

      if (existingComment.author_id !== userId) {
        throw new ForbiddenException('You can only update your own comments');
      }

      // Update the comment
      const { data: updatedComment, error } = await this.supabaseService
        .getClient()
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select(`
          *,
          author:users(id, name, surname, username, email)
        `)
        .single();

      if (error) {
        throw new BadRequestException(`Failed to update comment: ${error.message}`);
      }

      return updatedComment;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update comment');
    }
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    try {
      // First, check if comment exists and user is author
      const { data: existingComment, error: checkError } = await this.supabaseService
        .getClient()
        .from('comments')
        .select('author_id')
        .eq('id', id)
        .single();

      if (checkError || !existingComment) {
        throw new NotFoundException('Comment not found');
      }

      if (existingComment.author_id !== userId) {
        throw new ForbiddenException('You can only delete your own comments');
      }

      // Delete the comment
      const { error } = await this.supabaseService
        .getClient()
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        throw new BadRequestException(`Failed to delete comment: ${error.message}`);
      }

      return { message: 'Comment deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete comment');
    }
  }
}
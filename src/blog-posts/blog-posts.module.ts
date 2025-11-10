import { Module } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { BlogPostsController } from './blog-posts.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [BlogPostsService],
  controllers: [BlogPostsController],
  exports: [BlogPostsService],
})
export class BlogPostsModule {}
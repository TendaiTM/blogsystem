import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  Body, 
  Request, 
  UseGuards, 
  Put,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiBody 
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('comments')
@ApiBearerAuth('JWT-auth')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('post/:postId')
  @ApiOperation({ 
    summary: 'Get comments by post ID',
    description: 'Retrieve all comments for a specific blog post'
  })
  @ApiParam({ 
    name: 'postId', 
    description: 'Blog post ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns comments for the post' 
  })
  async getCommentsByPost(@Param('postId') postId: string) {
    return this.commentsService.getCommentsByPost(postId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Create a new comment',
    description: 'Add a comment to a blog post'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Comment created successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async createComment(@Body() createCommentDto: CreateCommentDto, @Request() req: any) {
    return this.commentsService.create(createCommentDto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Update comment',
    description: 'Update the content of a comment'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Comment ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: 'Updated comment content',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          example: 'Updated comment content...',
          description: 'New content for the comment'
        },
      },
      required: ['content'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Comment updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Comment not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only update their own comments' 
  })
  async updateComment(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any
  ) {
    return this.commentsService.update(id, body.content, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete comment',
    description: 'Permanently delete a comment'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Comment ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Comment deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Comment not found' 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'User can only delete their own comments' 
  })
  async deleteComment(@Param('id') id: string, @Request() req: any) {
    return this.commentsService.remove(id, req.user.id);
  }
}
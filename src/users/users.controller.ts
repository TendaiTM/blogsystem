import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards, 
  Request,
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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve all users (Admin only)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns all users' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieve authenticated user profile information'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns user profile' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async getProfile(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve specific user information by ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID', 
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns user data' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found' 
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Update authenticated user profile information'
  })
  @ApiBody({
    description: 'User profile update data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: 'John',
          description: 'User first name',
          nullable: true
        },
        surname: {
          type: 'string',
          example: 'Doe',
          description: 'User last name',
          nullable: true
        },
        profilePicture: {
          type: 'string',
          example: 'https://example.com/profile.jpg',
          description: 'Profile picture URL',
          nullable: true
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile updated successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async updateProfile(
    @Body() updateData: { name?: string; surname?: string; profilePicture?: string },
    @Request() req: any
  ) {
    return this.usersService.updateProfile(req.user.id, updateData);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete user profile',
    description: 'Permanently delete the authenticated user account'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User profile deleted successfully' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async removeProfile(@Request() req: any) {
    return this.usersService.remove(req.user.id);
  }
}
import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  UseInterceptors, 
  UploadedFile, 
  Put, 
  UseGuards, 
  Request, 
  BadRequestException 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { profilePictureConfig } from '../config/multer.config.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';


@ApiTags('auth') // Group all auth endpoints under 'auth' tag
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('profilePicture', profilePictureConfig))
  @ApiOperation({ 
    summary: 'Register a new user',
    description: 'Create a new user account with optional profile picture'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User registration data with optional profile picture',
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (optional)',
        },
        name: { 
          type: 'string', 
          example: 'John',
          description: 'User first name'
        },
        surname: { 
          type: 'string', 
          example: 'Doe',
          description: 'User last name'
        },
        username: { 
          type: 'string', 
          example: 'johndoe',
          description: 'Unique username'
        },
        email: { 
          type: 'string', 
          example: 'john.doe@example.com',
          description: 'User email address'
        },
        password: { 
          type: 'string', 
          example: 'password123',
          description: 'User password (min 6 characters)'
        },
      },
      required: ['name', 'surname', 'username', 'email', 'password'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User registered successfully',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          surname: 'Doe',
          username: 'johndoe',
          email: 'john.doe@example.com',
          profilePicture: '/uploads/profile-pictures/profile-123.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data or user already exists' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNPROCESSABLE_ENTITY, 
    description: 'File upload error' 
  })
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    let profilePicturePath: string | undefined;
    
    if (profilePicture) {
      profilePicturePath = `/uploads/profile-pictures/${profilePicture.filename}`;
    }

    return this.authService.register({
      ...registerDto, 
      profilePicture: profilePicturePath,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user and return JWT token'
  })
  @ApiBody({ 
    type: LoginDto,
    description: 'User login credentials' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'John',
          surname: 'Doe',
          username: 'johndoe',
          email: 'john.doe@example.com',
          profilePicture: '/uploads/profile-pictures/profile-123.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Invalid credentials' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data' 
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login({
      email: loginDto.email,
      password: loginDto.password
    });
  }

  @Put('profile/picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profilePicture', profilePictureConfig))
  @ApiOperation({ 
    summary: 'Update profile picture',
    description: 'Upload and update user profile picture (JWT required)'
  })
  @ApiBearerAuth('JWT-auth') // This matches the security scheme name in main.ts
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'New profile picture file',
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
          description: 'New profile picture file',
        },
      },
      required: ['profilePicture'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Profile picture updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John',
        surname: 'Doe',
        username: 'johndoe',
        email: 'john.doe@example.com',
        profilePicture: '/uploads/profile-pictures/new-profile-456.jpg',
        updated_at: '2024-01-15T10:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'No file provided or invalid file' 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized - JWT token required' 
  })
  async updateProfilePicture(
    @UploadedFile() profilePicture: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!profilePicture) {
      throw new BadRequestException('Profile picture is required');
    }

    const profilePicturePath = `/uploads/profile-pictures/${profilePicture.filename}`;
    return this.authService.updateProfile(req.user.id, {
      profilePicture: profilePicturePath
    });
  }
}
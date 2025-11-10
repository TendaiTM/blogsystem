import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async register(userData: {
    name: string;
    surname: string;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
  }): Promise<{ user: any; token: string }> {
    try {
      // Check if user already exists
      const { data: existingByEmail, error: emailError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', userData.email);

      const { data: existingByUsername, error: usernameError } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('username', userData.username);

      if (emailError) {
        console.error('❌ Email check error:', emailError);
        throw new BadRequestException('Error checking existing user by email');
      }

      if (usernameError) {
        console.error('❌ Username check error:', usernameError);
        throw new BadRequestException('Error checking existing user by username');
      }

      const existingUsers = [...(existingByEmail || []), ...(existingByUsername || [])];

      if (existingUsers.length > 0) {
        const existingEmail = existingByEmail && existingByEmail.length > 0;
        const existingUsername = existingByUsername && existingByUsername.length > 0;
        
        if (existingEmail) {
          throw new ConflictException('User with this email already exists');
        }
        if (existingUsername) {
          throw new ConflictException('User with this username already exists');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user in Supabase
      const { data: newUser, error: createError } = await this.supabaseService
        .getClient()
        .from('users')
        .insert([{
          name: userData.name,
          surname: userData.surname,
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          profile_picture: userData.profilePicture,
        }])
        .select()
        .single();

      if (createError) {
        console.error('Supabase create error:', createError)
        throw new BadRequestException(`Failed to create user: ${createError.message}`);
      }

      // Generate JWT token
      console.log('🎫 Generating JWT token...');
      try {
        const token = this.jwtService.sign({ 
          userId: newUser.id, 
          email: newUser.email 
        });
        console.log('✅ JWT token generated successfully');
        
        // Return user data without password
        const userResponse = {
          id: newUser.id,
          name: newUser.name,
          surname: newUser.surname,
          username: newUser.username,
          email: newUser.email,
          profile_picture: newUser.profile_picture,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at
        };
        
        console.log('✅ Registration completed successfully');
        return { user: userResponse, token };
        
      } catch (jwtError) {
        console.error('❌ JWT token generation failed:', jwtError);
        throw new BadRequestException('Token generation failed');
      }

    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(credentials: { email: string; password: string }): Promise<{ user: any; token: string }> {
    try {
      // Find user by email
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (error || !user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const token = this.jwtService.sign({ 
        userId: user.id, 
        email: user.email 
      });

      return { user, token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateUser(payload: any): Promise<any> {
    try {
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('id', payload.userId)
        .single();

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(userId: string, updateData: { profilePicture?: string; name?: string; surname?: string }): Promise<any> {
    try {
      const { data: updatedUser, error } = await this.supabaseService
        .getClient()
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(`Failed to update profile: ${error.message}`);
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Profile update failed');
    }
  }
}
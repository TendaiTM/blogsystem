import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(): Promise<any[]> {
    try {
      const { data: users, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('id, name, surname, username, email, profile_picture, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw new BadRequestException(`Failed to fetch users: ${error.message}`);
      }

      return users || [];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('id, name, surname, username, email, profile_picture, created_at')
        .eq('id', id)
        .single();

      if (error || !user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<any> {
    try {
      const { data: user, error } = await this.supabaseService
        .getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return user;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(userId: string, updateData: Partial<{ name: string; surname: string; profile_picture: string }>): Promise<any> {
    try {
      const { data: updatedUser, error } = await this.supabaseService
        .getClient()
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new BadRequestException(`Failed to update user: ${error.message}`);
      }

      return updatedUser;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(userId: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new BadRequestException(`Failed to delete user: ${error.message}`);
      }

      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete user');
    }
  }
}
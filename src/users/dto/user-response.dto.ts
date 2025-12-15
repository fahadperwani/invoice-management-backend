import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { IsUUID, IsString, IsEmail } from 'class-validator';
import { User } from '../entities/user.entity';

// Use @Exclude() to ensure passwordHash is NEVER sent to the client
@Exclude()
export class UserResponseDto {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsEmail()
  email: string;

  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  status: string; // The membership status (active/disabled)

  @Expose()
  @IsString()
  roleName: string; // The assigned role name (e.g., "Admin")

  // --- Static method to transform entity to DTO ---
  // This is used in the service layer to clean the data before returning.
  static fromEntity(
    user: User,
    roleName: string,
    status: string,
  ): UserResponseDto {
    const dto = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true, // Only fields with @Expose() are included
    });

    // Manually assign computed/related fields
    dto.roleName = roleName;
    dto.status = status;

    return dto;
  }
}

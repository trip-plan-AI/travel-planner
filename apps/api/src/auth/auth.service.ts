import { Injectable } from '@nestjs/common'
import type { CreateUserDto } from './dto/create-user.dto'
import type { LoginDto } from './dto/login.dto'

// Stub — будет реализован в TRI-06
@Injectable()
export class AuthService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateUser(_email: string, _password: string): Promise<unknown> {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async register(_dto: CreateUserDto): Promise<{ accessToken: string }> {
    throw new Error('Not implemented')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async login(_dto: LoginDto): Promise<{ accessToken: string }> {
    throw new Error('Not implemented')
  }
}

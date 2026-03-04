import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DbModule } from './db/db.module'
import { TripsModule } from './trips/trips.module'
import { PointsModule } from './points/points.module'
import { UsersModule } from './users/users.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    DbModule,
    TripsModule,
    PointsModule,
    UsersModule,
  ],
})
export class AppModule {}

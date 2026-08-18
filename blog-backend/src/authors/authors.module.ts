import { Module } from '@nestjs/common';
import { ArticlesModule } from '../articles/articles.module';
import { AuthorsController } from './authors.controller';

@Module({
  imports: [ArticlesModule],
  controllers: [AuthorsController],
})
export class AuthorsModule {}

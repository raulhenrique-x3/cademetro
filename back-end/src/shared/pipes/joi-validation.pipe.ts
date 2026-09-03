import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import type { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(@Optional() private schema?: ObjectSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const targetSchema: ObjectSchema | undefined =
      this.schema ?? (metadata.metatype as any)?.schema;

    if (!targetSchema) {
      return value;
    }

    const { error, value: validatedValue } = targetSchema.validate(value, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return validatedValue;
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function sanitize(data: any): any {
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const copy: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (key === 'passwordHash') {
        continue;
      }
      copy[key] = sanitize(data[key]);
    }
    return copy;
  }
  return data;
}

@Injectable()
export class SanitizeUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => sanitize(data)));
  }
}

# TypeORM Setup - Hotel API

### 📦 Estructura

- **Config**: `src/config/database.config.ts` - Configuración de conexión a BD
- **Entities**: `src/entities/` - Modelos

### 🔧 Variables de Entorno

Edita `.env`:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=hotel_db
PORT=3000
```

### 📝 Cómo Crear Nuevas Entities

**Ejemplo: Entity de Room**

```typescript
// src/entities/room.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: string;

  @Column()
  type: string; // single, double, suite

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Hotel)
  hotel: Hotel;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

Luego importa en `app.module.ts`:
```typescript
TypeOrmModule.forRoot({
  ...databaseConfig(),
  entities: [Hotel, Room],
})
```

### 🔄 Relaciones Comunes

```typescript
// One-to-Many
@OneToMany(() => Room, room => room.hotel)
rooms: Room[];

// Many-to-One
@ManyToOne(() => Hotel)
hotel: Hotel;

// One-to-One
@OneToOne(() => Profile)
profile: Profile;

// Many-to-Many
@ManyToMany(() => Tag)
@JoinTable()
tags: Tag[];
```

### 💾 Migraciones (Opcional)

Para generar migraciones automáticas:
```bash
typeorm migration:generate -n CreateHotelsTable
typeorm migration:run
```
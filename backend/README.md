# Agricultural Management Backend API

Backend API for managing agricultural operations including crops, inputs, productions, and users.

## Features

- **User Management**: CRUD operations for users with different roles
- **Input Management**: Track supplies with automatic consumption when used
- **Crop Management**: Manage different types of crops and their locations
- **Production Management**: Create productions that consume inputs automatically
- **Input Consumption**: Automatic quantity reduction when inputs are used in productions

## Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a `.env` file based on `.env.example`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Configure your MySQL database connection in `.env`

5. Start the server:
   \`\`\`bash
   # Development
   npm run dev
   
   # Production
   npm start
   \`\`\`

## API Endpoints

### Users (`/api/usuarios`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Soft delete user

### Inputs (`/api/insumos`)
- `GET /` - Get all inputs
- `GET /:id` - Get input by ID
- `POST /` - Create new input
- `PUT /:id` - Update input
- `POST /:id/consume` - Consume input (reduce quantity)
- `DELETE /:id` - Soft delete input

### Crops (`/api/cultivos`)
- `GET /` - Get all crops
- `GET /:id` - Get crop by ID
- `POST /` - Create new crop
- `PUT /:id` - Update crop
- `DELETE /:id` - Soft delete crop

### Productions (`/api/producciones`)
- `GET /` - Get all productions
- `GET /:id` - Get production by ID
- `POST /` - Create new production (with input consumption)
- `PUT /:id` - Update production
- `DELETE /:id` - Soft delete production

## Input Consumption Logic

When creating a production, you can specify inputs to consume:

\`\`\`json
{
  "nombre": "Producción de Tomates",
  "tipo": "Hortalizas",
  "insumos_consumo": [
    {
      "id": 1,
      "cantidad": 5
    },
    {
      "id": 2,
      "cantidad": 10
    }
  ]
}
\`\`\`

The system will:
1. Check if inputs exist and have sufficient quantity
2. Reduce the quantity of each input
3. Disable inputs that reach 0 quantity
4. Create the production with consumed input IDs

## Database Schema

The API works with the following main entities:
- `usuarios` - System users with roles
- `insumos` - Agricultural inputs/supplies
- `cultivos` - Crop types and locations
- `producciones` - Production records
- `ciclo_cultivo` - Crop cycles
- `sensores` - Monitoring sensors

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

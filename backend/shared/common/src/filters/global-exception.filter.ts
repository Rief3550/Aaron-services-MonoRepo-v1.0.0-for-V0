/**
 * Filtro global para manejo de excepciones
 */
export class GlobalExceptionFilter {
  catch(exception: unknown) {
    // Implementación del filtro de excepciones global
    console.error('GlobalExceptionFilter:', exception);
    return {
      statusCode: 500,
      message: 'Internal server error'
    };
  }
}


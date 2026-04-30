# Catálogo de Casos de Prueba Típicos

Este documento sirve como base para el diseño y ejecución de pruebas E2E y manuales para los formularios y flujos de datos.

## 1. Validación de Entradas y Límites (Input Validation)

- Probar campos vacíos en cualquier combinación (identificar campos obligatorios vs opcionales).
- Probar campos con contenido extremadamente extenso (superar el `maxlength` o los límites del esquema de BD).
- Probar romper las máscaras (ej. insertar letras en campos numéricos, formato de teléfono o documento incorrectos).
- Probar insertar duplicados si el esquema lo prohíbe (ej. códigos de barras idénticos, correos o nombres de usuario duplicados).
- Probar valores numéricos frontera (ej. `0`, valores negativos, o el máximo valor posible donde aplique como en precios/cantidades).
- Probar formatos inválidos en campos específicos (ej. correos sin `@`, fechas inexistentes como `31/02/2026`).
- Probar la inclusión de espacios en blanco (solo enviar espacios, espacios al principio/final del string).

## 2. Lógica de Interfaz y Comportamiento de Formularios

- Probar el cierre o cancelación de un formulario (confirmar el vaciado "wiping" de la información al salir y/o al guardar exitosamente).

## 3. Flujos de Lógica de Negocio (CRUD y Ciclo de vida)

- Probar el ciclo completo de vida (Flujo E2E: Crear registro -> Ver que exista -> Editarlo -> Ver el cambio -> Borrarlo -> Verificar su ausencia).
- Probar acciones ilegales de negocio (ej. borrar una entidad requerida por otras, como eliminar un proveedor que ya tiene productos asociados a él).

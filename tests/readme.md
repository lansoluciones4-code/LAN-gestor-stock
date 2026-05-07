# Playwright Tests - Guía de Ejecución

## Instalación

Si Playwright no está instalado, ejecutar el siguiente comando en la carpeta raíz del proyecto:

```bash
npm init playwright@latest
```

## Comandos de Ejecución

Correr antes de cada prueba, no todas lo necesitan, pero es mejor prevenir.

```bash
npm run db:reset-data-hard
```

Tambien se puede correr una version menos agresiva de este comando, que no reinicia la tabla de usuarios para evitar la sesion inválida.

```bash
npm run db:reset-data
```

Ejecuta un archivo de pruebas específico en todos los navegadores configurados:

```bash
npx playwright test tests/nombre_del_archivo.spec.ts
```

Ejecuta todos los archivos de pruebas en el directorio:

```bash
npx playwright test tests
```

Limita la ejecución de la prueba únicamente al motor de Google Chrome:

```bash
npx playwright test tests/nombre_del_archivo.spec.ts --project=chromium
```

Ejecuta la prueba abriendo la ventana del navegador de forma visible (Modo Headed) para ver qué está pasando:

```bash
npx playwright test tests/nombre_del_archivo.spec.ts --headed
```

## Reportes y Herramientas (Codegen)

Muestra el reporte final en caso de éxito o fallo:

```bash
npx playwright show-report
```

Abre el navegador y la herramienta que graba tus clics y tipeos, transformándolos en código TypeScript:

```bash
npx playwright codegen http://localhost:3000
```

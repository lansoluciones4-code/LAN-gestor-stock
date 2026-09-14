/**
 * Fuente de verdad de los campos específicos de cada tipo de equipo en "Recepción de Equipo",
 * calcados de las 3 planillas reales del Excel "SERVICIO TECNICO 2026" (hojas CONSOLAS, PC
 * ESCRITORIO y NOTEBOOK). Un mismo array alimenta tres cosas: el formulario dinámico del modal
 * de alta/edición, el schema Zod de `specs` (ver `device-intake.schema.ts`), y el orden de
 * impresión de la planilla A4 — así que el orden de cada array importa y debe respetar el Excel.
 */
export type EquipmentType = 'consola' | 'pc_escritorio' | 'notebook';

export const EQUIPMENT_TYPES: EquipmentType[] = ['consola', 'pc_escritorio', 'notebook'];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  consola: 'Consola',
  pc_escritorio: 'PC Escritorio',
  notebook: 'Notebook',
};

export type DeviceIntakeFieldKind = 'text' | 'boolean' | 'choice';

export interface DeviceIntakeFieldDef {
  key: string;
  label: string;
  kind: DeviceIntakeFieldKind;
  /** Solo para kind: 'choice' — las dos opciones que se muestran como toggle de dos botones. */
  choices?: [string, string];
}

export const DEVICE_INTAKE_FIELDS: Record<EquipmentType, DeviceIntakeFieldDef[]> = {
  consola: [
    { key: 'consola', label: 'Consola', kind: 'text' },
    { key: 'modelo', label: 'Modelo', kind: 'text' },
    { key: 'nroSerie', label: 'Nro. de Serie', kind: 'text' },
    { key: 'almacenamiento', label: 'Almacenamiento', kind: 'text' },
    { key: 'almacenamientoAdicional', label: 'Almacenamiento Adicional', kind: 'text' },
    { key: 'colorEquipo', label: 'Color del Equipo', kind: 'text' },
    { key: 'cableHdmi', label: 'Cable HDMI', kind: 'boolean' },
    { key: 'cableAlimentacion', label: 'Cable de Alimentación', kind: 'boolean' },
    { key: 'hdmiEnBuenEstado', label: 'HDMI en Buen Estado', kind: 'boolean' },
    { key: 'usbEnBuenEstado', label: 'USB en Buen Estado', kind: 'boolean' },
    { key: 'enciende', label: 'Enciende', kind: 'boolean' },
    { key: 'daImagen', label: 'Da Imagen', kind: 'boolean' },
    { key: 'conectaWifi', label: 'Conecta WiFi', kind: 'boolean' },
    { key: 'faltanTornillos', label: 'Faltan Tornillos', kind: 'boolean' },
    { key: 'estructuraDanada', label: 'Estructura Dañada', kind: 'boolean' },
    { key: 'conControl', label: 'Con Control', kind: 'boolean' },
  ],
  pc_escritorio: [
    { key: 'procesador', label: 'Procesador', kind: 'text' },
    { key: 'motherboard', label: 'Motherboard', kind: 'text' },
    { key: 'memoria', label: 'Memoria', kind: 'text' },
    { key: 'disco1', label: 'Disco 1', kind: 'text' },
    { key: 'disco2', label: 'Disco 2', kind: 'text' },
    { key: 'disco3', label: 'Disco 3', kind: 'text' },
    { key: 'placaDeVideo', label: 'Placa de Video', kind: 'text' },
    { key: 'fuente', label: 'Fuente', kind: 'text' },
    { key: 'gabinete', label: 'Gabinete', kind: 'text' },
    { key: 'sistemaOperativo', label: 'Sistema Operativo', kind: 'text' },
    { key: 'contrasena', label: 'Contraseña', kind: 'text' },
    { key: 'detallesGabinete', label: 'Detalles del Gabinete', kind: 'text' },
    { key: 'faltanTapas', label: 'Faltan Tapas', kind: 'boolean' },
    { key: 'faltanTornillos', label: 'Faltan Tornillos', kind: 'boolean' },
    { key: 'frenteDanado', label: 'Frente Dañado', kind: 'boolean' },
    { key: 'puertosDanados', label: 'Puertos Dañados', kind: 'boolean' },
    { key: 'accesoriosAdicionales', label: 'Accesorios Adicionales', kind: 'text' },
  ],
  notebook: [
    { key: 'marcaEquipo', label: 'Marca del Equipo', kind: 'text' },
    { key: 'modelo', label: 'Modelo', kind: 'text' },
    { key: 'nroSerie', label: 'Nro. de Serie', kind: 'text' },
    { key: 'procesador', label: 'Procesador', kind: 'text' },
    { key: 'memoria', label: 'Memoria', kind: 'text' },
    { key: 'disco1', label: 'Disco 1', kind: 'text' },
    { key: 'disco2', label: 'Disco 2', kind: 'text' },
    { key: 'sistemaOperativo', label: 'Sistema Operativo', kind: 'text' },
    { key: 'contrasena', label: 'Contraseña', kind: 'text' },
    { key: 'cargador', label: 'Cargador', kind: 'choice', choices: ['Original', 'Alternativo'] },
    { key: 'faltanTornillos', label: 'Faltan Tornillos', kind: 'boolean' },
    { key: 'faltanAntideslizantes', label: 'Faltan Antideslizantes', kind: 'boolean' },
    { key: 'bisagrasDanadas', label: 'Bisagras Dañadas', kind: 'boolean' },
    { key: 'pantallaDanada', label: 'Pantalla Dañada', kind: 'boolean' },
    { key: 'estructuraDanada', label: 'Estructura Dañada', kind: 'boolean' },
    { key: 'faltanTeclas', label: 'Faltan Teclas', kind: 'boolean' },
    { key: 'usbOPuertosDanados', label: 'USB o Puertos Dañados', kind: 'boolean' },
    { key: 'evidenciaLiquidos', label: 'Evidencia de Líquidos', kind: 'boolean' },
  ],
};

/** Valores iniciales de `specs` para un tipo de equipo (boolean → false, choice → primera opción, texto → ''). */
export function buildDefaultDeviceIntakeSpecs(type: EquipmentType): Record<string, string | boolean> {
  const specs: Record<string, string | boolean> = {};
  for (const field of DEVICE_INTAKE_FIELDS[type]) {
    if (field.kind === 'boolean') specs[field.key] = false;
    else if (field.kind === 'choice') specs[field.key] = field.choices![0];
    else specs[field.key] = '';
  }
  return specs;
}

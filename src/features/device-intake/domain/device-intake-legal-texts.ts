import { type EquipmentType } from '@/config/forms/device-intake-fields';

/**
 * Textos legales fijos de la planilla de recepción, calcados verbatim del Excel
 * "SERVICIO TECNICO 2026". Consola tiene su propio texto (mantenimiento preventivo); PC
 * Escritorio y Notebook comparten el mismo texto en el Excel original.
 */

export const DEVICE_INTAKE_IMPORTANT_NOTICE = `IMPORTANTE
• Conserve esta constancia hasta retirar su equipo.
• Para retirar el equipo deberá presentar esta orden o acreditar identidad.
• Consulte el estado de la reparación mediante WhatsApp 2804777200`;

const CONSOLA_TERMS = `Términos y condiciones
1. Alcance del servicio
El servicio contratado consiste exclusivamente en tareas de mantenimiento preventivo, pudiendo incluir, según corresponda:
• Desarme del equipo.
• Limpieza interna.
• Remoción de polvo y pelusas.
• Reemplazo de pasta térmica.
• Aplicación de grasa térmica.
• Aplicación de metal líquido (cuando corresponda y sea autorizado).
• Reemplazo de thermal pads.
Este servicio no constituye una reparación electrónica ni garantiza la solución de fallas de funcionamiento preexistentes.
2. Fallas preexistentes
El cliente declara conocer que el mantenimiento preventivo no modifica el estado de componentes electrónicos defectuosos.
Si durante el proceso se detectaran fallas distintas a las informadas inicialmente, las mismas serán comunicadas al cliente antes de realizar cualquier reparación adicional.
3. Equipos previamente intervenidos
En equipos que presenten reparaciones anteriores, tornillos dañados, piezas faltantes, sellos removidos, modificaciones o daños ocultos, LAN Soluciones Tecnológicas no será responsable por inconvenientes derivados de dichas intervenciones previas.
4. Equipos con deterioro
Algunas consolas presentan plásticos, conectores, clips o tornillos deteriorados por el uso, el calor o el paso del tiempo. El cliente acepta que durante el procedimiento de desmontaje pueden evidenciarse daños preexistentes o producirse roturas inevitables derivadas del estado de conservación del equipo, sin que ello implique negligencia del servicio técnico.
5. Metal líquido
Cuando el cliente autorice la utilización de metal líquido, declara conocer que se trata de un material conductor de electricidad que requiere mantenimiento especializado.
Su aplicación será realizada siguiendo procedimientos técnicos adecuados.
6. Garantía
La garantía cubre exclusivamente el trabajo realizado de mantenimiento preventivo.
No cubre:
• Fallas electrónicas.
• Fuente de alimentación.
• Disco rígido o SSD.
• GPU.
• CPU/APU.
• Memorias.
• Lectora.
• Daños ocasionados por líquidos.
• Sobretensiones eléctricas.
• Golpes.
• Manipulación posterior por terceros.
7. Permanencia del equipo terminado
El cliente se compromete a retirar el equipo dentro de los siete (7) días corridos contados desde la primera notificación de finalización del servicio.
Transcurrido dicho plazo, LAN Soluciones Tecnológicas podrá actualizar el importe pendiente correspondiente a mano de obra, repuestos, insumos o cualquier otro concepto presupuestado, cuando existan variaciones objetivas en los costos de reposición o prestación del servicio.
Asimismo, la empresa podrá aplicar un cargo razonable por guarda y almacenamiento del equipo mientras permanezca en depósito.
8. Equipos no retirados
Si el cliente no retirara el equipo dentro de los sesenta (60) días corridos posteriores a la primera notificación de finalización del servicio, y no hubiera comunicado por escrito una causa que justifique la demora ni acordado expresamente una prórroga, el equipo será considerado abandonado. En tal supuesto, LAN Soluciones Tecnológicas podrá disponer del equipo conforme a la legislación aplicable, incluyendo su utilización para compensar total o parcialmente los importes adeudados, los gastos de guarda, almacenamiento, reparación y demás costos ocasionados por la prestación del servicio, sin perjuicio de las acciones legales que pudieran corresponder para el cobro de cualquier saldo pendiente.
9. Aceptación
Con la firma de la presente Orden de Servicio, el cliente declara haber leído íntegramente estas condiciones, comprender su alcance y aceptarlas en todos sus términos.`;

const PC_Y_NOTEBOOK_TERMS = `Términos y condiciones del servicio técnico
1. Garantía
La garantía otorgada por LAN Soluciones Tecnológicas cubre exclusivamente las reparaciones y/o componentes detallados en la presente Orden de Servicio.
La garantía quedará sin efecto cuando el equipo presente evidencias de manipulación por terceros, golpes, daños físicos, sobretensión eléctrica, uso indebido o ingreso de líquidos, humedad, corrosión o sulfatación, independientemente de que dichos daños sean anteriores o posteriores a la reparación.
2. Respaldo y conservación de la información
El cliente declara conocer que toda intervención técnica puede implicar riesgos inherentes sobre la información almacenada en el equipo.
Siempre que las condiciones técnicas del equipo lo permitan, LAN Soluciones Tecnológicas realizará el respaldo de la información almacenada localmente en las unidades de almacenamiento del equipo (disco rígido, SSD, memoria interna u otros medios físicos instalados en el dispositivo).
No forman parte del respaldo los archivos alojados en servicios de almacenamiento en la nube, tales como Google Drive, OneDrive, iCloud, Dropbox o cualquier otra plataforma similar, ni la información sincronizada con cuentas de correo electrónico, perfiles de usuario o aplicaciones de terceros.
El cliente reconoce que dichos servicios requieren credenciales personales de acceso y que LAN Soluciones Tecnológicas no solicita, almacena ni administra dichas credenciales.
En caso de que, como consecuencia del diagnóstico o la reparación, resulte necesaria la reinstalación del sistema operativo, restauración de fábrica, reemplazo de unidad de almacenamiento o cualquier otro procedimiento que implique la eliminación de configuraciones o datos, el cliente asume la responsabilidad exclusiva de conocer, conservar y disponer de las credenciales necesarias para acceder nuevamente a sus cuentas y recuperar la información almacenada en la nube.
En consecuencia, LAN Soluciones Tecnológicas no será responsable por:
• la pérdida de acceso a cuentas de Google, Microsoft, Apple u otras plataformas;
• la imposibilidad de recuperar archivos sincronizados en la nube por desconocimiento u olvido de contraseñas, códigos de verificación o mecanismos de autenticación;
• la pérdida de licencias, configuraciones, sesiones iniciadas o aplicaciones asociadas a cuentas personales;
• cualquier información que no se encuentre almacenada físicamente en el equipo al momento de su recepción.
El cliente declara haber sido informado de estas circunstancias y acepta que cualquier reclamo relacionado con información almacenada fuera del equipo o con el acceso a cuentas personales será de su exclusiva responsabilidad.
3. Notificación de finalización del servicio
Finalizada la reparación, LAN Soluciones Tecnológicas notificará al cliente mediante cualquiera de los medios de contacto informados en la presente Orden de Servicio (WhatsApp, correo electrónico, mensaje de texto o llamada telefónica), considerándose válida cualquiera de dichas notificaciones.
4. Permanencia del equipo terminado
El cliente se compromete a retirar el equipo dentro de los siete (7) días corridos contados desde la primera notificación de finalización del servicio.
Transcurrido dicho plazo, LAN Soluciones Tecnológicas podrá actualizar el importe pendiente correspondiente a mano de obra, repuestos, insumos o cualquier otro concepto presupuestado, cuando existan variaciones objetivas en los costos de reposición o prestación del servicio.
Asimismo, la empresa podrá aplicar un cargo razonable por guarda y almacenamiento del equipo mientras permanezca en depósito.
5. Equipos no retirados
Si el cliente no retirara el equipo dentro de los sesenta (60) días corridos posteriores a la primera notificación de finalización del servicio, y no hubiera comunicado por escrito una causa que justifique la demora ni acordado expresamente una prórroga, el equipo será considerado abandonado.
En tal supuesto, LAN Soluciones Tecnológicas podrá disponer del equipo conforme a la legislación aplicable, incluyendo su utilización para compensar total o parcialmente los importes adeudados, los gastos de guarda, almacenamiento, reparación y demás costos ocasionados por la prestación del servicio, sin perjuicio de las acciones legales que pudieran corresponder para el cobro de cualquier saldo pendiente.
6. Aceptación
Con la firma de la presente Orden de Servicio, el cliente declara haber leído íntegramente estas condiciones, comprender su alcance y aceptarlas en todos sus términos.`;

export const DEVICE_INTAKE_TERMS_BY_TYPE: Record<EquipmentType, string> = {
  consola: CONSOLA_TERMS,
  pc_escritorio: PC_Y_NOTEBOOK_TERMS,
  notebook: PC_Y_NOTEBOOK_TERMS,
};

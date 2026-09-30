# Coordinador de Vibraciones — v5.0.0

PWA para preparar y compartir la programación semanal de la reunión de vibraciones.

## Motor de rotación
- Secuencia ordinaria: Oración inicio → Pan Nuestro → Evangelio → Vibración física → Vibración espiritual → Vibración familias → Vibración general → Oración final.
- La referencia siempre es la programación del miércoles anterior, aunque una persona finalmente no haya podido asistir.
- Ninguna persona puede repetir la misma actividad ordinaria ni retroceder a una actividad anterior de su ciclo.
- El reinicio después de Oración final continúa hacia el comienzo de un nuevo ciclo.
- Anita Suarez no realiza Pan Nuestro; cuando su turno cae allí se conserva la regla especial de avance de la rueda.
- El motor prioriza el siguiente turno válido y solo salta hacia adelante cuando las restricciones lo requieren.

## Pacientes trabajadores — v5
- Se pueden registrar hasta dos pacientes trabajadores.
- El Paciente 2 es opcional, por lo que la aplicación sigue funcionando con uno solo.
- Para cada paciente se define de manera independiente si queda solamente como paciente o si además realiza una actividad ordinaria.
- Si realiza actividad, se selecciona una actividad exacta.
- El selector bloquea tareas que impliquen repetir, retroceder o asignar Pan Nuestro a Anita Suarez.
- Dos pacientes no pueden ocupar la misma actividad ordinaria.
- El responsable de Vibración por trabajador puede realizar también Evangelio únicamente cuando la progresión de su rotación lo permite.

## Operación
- Debajo de cada actividad se muestra solo el nombre de quien realizó esa misma actividad el miércoles anterior.
- Los cambios manuales recalculan las demás tareas automáticamente.
- Generar el mensaje guarda la programación como antecedente del siguiente miércoles.
- El capítulo del libro avanza automáticamente y puede cambiarse mediante una lista con número y título.

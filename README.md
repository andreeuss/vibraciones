# Coordinador de Vibraciones — v8.0

PWA para preparar y compartir la programación semanal de la reunión de vibraciones.

## Motor de rotación
- Secuencia ordinaria: Oración inicio → Pan Nuestro → Evangelio → Vibración física → Vibración espiritual → Vibración familias → Vibración general → Oración final.
- La referencia siempre es la programación del miércoles anterior, aunque una persona finalmente no haya podido asistir.
- La posición ordinaria de cada persona avanza sin repetir ni retroceder.
- El reinicio después de Oración final continúa hacia el comienzo de un nuevo ciclo.
- Anita Suarez no realiza Pan Nuestro; cuando su turno cae allí se conserva la regla especial de avance de la rueda.
- El motor prioriza el siguiente turno válido y solo salta hacia adelante cuando las restricciones lo requieren.
- El motor elige al mismo tiempo la distribución y quién descansa, para evitar combinaciones imposibles causadas por una exclusión prematura.
- El paso de Oración final al inicio se reconoce como continuidad del ciclo.

## Pacientes trabajadores
- Se pueden registrar hasta dos pacientes trabajadores.
- Una sola persona realiza Vibración por trabajador para los pacientes registrados.
- El Paciente 2 es opcional, por lo que la aplicación sigue funcionando con uno solo.
- Para cada paciente se define de manera independiente si queda solamente como paciente o si además realiza una actividad ordinaria.
- Si realiza actividad, se selecciona una actividad exacta.
- El selector bloquea tareas que impliquen repetir, retroceder o asignar Pan Nuestro a Anita Suarez.
- Dos pacientes no pueden ocupar la misma actividad ordinaria.
- Cuando hay pacientes, el coordinador elige Pan Nuestro, Evangelio o Ninguna para quien realiza Vibración por trabajador. La opción puede repetirse en semanas consecutivas.
- Anita Suárez puede elegir Evangelio o Ninguna, pero nunca Pan Nuestro.
- Si se elige Ninguna, el responsable no ocupa una actividad ordinaria por esta función y los demás cubren la rueda.
- Si el responsable también figura como paciente y elige una lectura, su actividad debe coincidir con esa lectura. Si elige Ninguna, puede figurar como solo paciente.
- El historial guarda el turno que le correspondía al responsable en la rueda. Si su turno era Vibración espiritual y realiza Evangelio, la semana siguiente avanza desde Vibración espiritual hacia Vibración familias.
- Cuando el responsable carece de un turno previo, la actividad asociada deja su posición ordinaria sin establecer.

## Operación
- Debajo de cada actividad se muestra solo el nombre de quien realizó esa misma actividad el miércoles anterior.
- Los cambios manuales recalculan las demás tareas automáticamente.
- Generar el mensaje guarda la programación como antecedente del siguiente miércoles.
- El capítulo del libro avanza automáticamente y puede cambiarse mediante una lista con número y título.


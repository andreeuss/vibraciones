# Coordinador de Vibraciones — v6.0

PWA para preparar y compartir la programación semanal de la reunión de vibraciones.

## Motor de rotación
- Secuencia ordinaria: Oración inicio → Pan Nuestro → Evangelio → Vibración física → Vibración espiritual → Vibración familias → Vibración general → Oración final.
- La referencia siempre es la programación del miércoles anterior, aunque una persona finalmente no haya podido asistir.
- La posición ordinaria de cada persona avanza sin repetir ni retroceder.
- El reinicio después de Oración final continúa hacia el comienzo de un nuevo ciclo.
- Anita Suarez no realiza Pan Nuestro; cuando su turno cae allí se conserva la regla especial de avance de la rueda.
- El motor prioriza el siguiente turno válido y solo salta hacia adelante cuando las restricciones lo requieren.

## Pacientes trabajadores
- Se pueden registrar hasta dos pacientes trabajadores.
- El Paciente 2 es opcional, por lo que la aplicación sigue funcionando con uno solo.
- Para cada paciente se define de manera independiente si queda solamente como paciente o si además realiza una actividad ordinaria.
- Si realiza actividad, se selecciona una actividad exacta.
- El selector bloquea tareas que impliquen repetir, retroceder o asignar Pan Nuestro a Anita Suarez.
- Dos pacientes no pueden ocupar la misma actividad ordinaria.
- Cuando hay pacientes, el coordinador elige Pan Nuestro o Evangelio para quien realiza Vibración por trabajador. Puede elegir la misma lectura en semanas consecutivas. Para Anita Suárez, la única opción es Evangelio.
- Si el responsable también figura como paciente, su actividad debe coincidir con la lectura asociada.
- El historial guarda el turno que le correspondía al responsable en la rueda. Si su turno era Vibración espiritual y realiza Evangelio, la semana siguiente avanza desde Vibración espiritual hacia Vibración familias.
- Cuando el responsable carece de un turno previo, la lectura elegida establece su posición inicial.

## Operación
- Debajo de cada actividad se muestra solo el nombre de quien realizó esa misma actividad el miércoles anterior.
- Los cambios manuales recalculan las demás tareas automáticamente.
- Generar el mensaje guarda la programación como antecedente del siguiente miércoles.
- El capítulo del libro avanza automáticamente y puede cambiarse mediante una lista con número y título.

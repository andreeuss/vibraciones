# Coordinador de Vibraciones

Aplicación web/PWA minimalista para organizar la programación semanal de la reunión de vibraciones y generar el mensaje listo para WhatsApp.

## Publicación con GitHub Pages

1. Crea un repositorio público en GitHub.
2. Sube **el contenido de esta carpeta directamente a la raíz del repositorio**.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama **main** y la carpeta **/(root)**.
6. Pulsa **Save**.
7. Espera a que GitHub muestre la dirección publicada y ábrela desde el celular.

## Uso

- Selecciona las personas que participan ese miércoles.
- Define si existe paciente trabajador y, cuando aplique, selecciona `Paciente trabajador GENE` y `Vibración por trabajador`.
- Genera la programación.
- Revisa la actividad del miércoles anterior cuando lo necesites.
- Genera el mensaje para WhatsApp y compártelo.
- Al confirmar y guardar la reunión, el libro avanza al capítulo siguiente.

## Datos

La información se conserva en el almacenamiento local del navegador del dispositivo. No requiere servidor ni base de datos en esta versión.

## PWA

La aplicación incluye `manifest.webmanifest`, `service worker` e iconos 192/512 para permitir su instalación en dispositivos compatibles una vez publicada mediante HTTPS (GitHub Pages).

# Agenda+

Web pública: https://rgavsan2704.github.io/agenda-plus/

Versión 8: horario compacto en tabla con días en columnas, edición de horario separada, entregas por fecha y hora o por clase, calendario de días lectivos, asignaturas, notas, calificaciones y estudio.

HTML, CSS y JavaScript sin compilación. GitHub Pages publica main desde su raíz.

Cada visitante guarda sus datos en su navegador. No se publican horarios personales ni credenciales. Para trasladar los datos a otro navegador, exporta una copia en Ajustes e impórtala allí. No hay sincronización automática ni integración permanente con PASEN.

La caché offline pertenece exclusivamente a esta versión y ruta. Los datos se mantienen bajo la clave de almacenamiento existente para conservar la compatibilidad con la agenda anterior en el mismo navegador y dominio.


Actualizaciones: el enlace raíz permanece fijo. La aplicación consulta version.json al abrir, recuperar la conexión, volver a la pestaña y cada minuto. Difiere la recarga durante formularios o sesiones de estudio; conserva localStorage. En cada publicación incrementar version.json, current en updates.js, el pie de index.html, las consultas de recursos y la versión de caché de sw.js. Publicar todos juntos.

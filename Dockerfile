# Usa una imagen base de Nginx muy ligera (alpine) para servir archivos estáticos.
# Esto asegura que tu aplicación sea muy rápida de desplegar y tenga un footprint pequeño.
FROM nginx:alpine

# La instrucción COPY . /usr/share/nginx/html/ copia recursivamente todos 
# los archivos y carpetas del directorio local donde se encuentra el Dockerfile 
# (incluyendo index.html, login.html, ayuda.html, auth.js, etc.) al directorio 
# que Nginx utiliza para servir contenido web.
COPY . /usr/share/nginx/html/

# Nginx por defecto usa el puerto 80 dentro del contenedor.
EXPOSE 80

# El comando por defecto de Nginx:alpine ejecuta el servidor, no necesitamos redefinirlo.
# CMD ["nginx", "-g", "daemon off;"]

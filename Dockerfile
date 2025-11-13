# Usa una imagen base de Nginx muy ligera (alpine) para servir archivos estáticos.
# Esto asegura que tu aplicación sea muy rápida de desplegar y tenga un footprint pequeño.
FROM nginx:alpine

# Copia tu archivo index.html (y cualquier otro archivo estático como imágenes o CSS si los tuvieras)
# al directorio donde Nginx busca los archivos para servir.
COPY index.html /usr/share/nginx/html/

# Nginx por defecto usa el puerto 80 dentro del contenedor.
EXPOSE 80

# El comando por defecto de Nginx:alpine ejecuta el servidor, no necesitamos redefinirlo.
# CMD ["nginx", "-g", "daemon off;"]

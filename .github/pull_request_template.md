## Descripción

Breve descripción del cambio. ¿Qué problema resuelve o qué funcionalidad añade?

## Motivación

¿Por qué es necesario este cambio? Referencia a issue o contexto.

## Cambios realizados

- [ ] Cambio 1
- [ ] Cambio 2
- [ ] Cambio 3

## Cómo probar

1. Comando o pasos para levantar el entorno:
   ```bash
   docker compose up -d --build
   ```
2. Acciones para verificar el comportamiento esperado.
3. Casos edge considerados.

## Checklist

- [ ] He probado los cambios localmente (dev con `docker compose up`)
- [ ] El código compila/build sin errores (`npm run build` / `poetry install`)
- [ ] He revisado que no queden `console.log`, prints de debug o código comentado
- [ ] Las variables de entorno nuevas están documentadas en `.example.env`
- [ ] Los cambios en infraestructura Docker funcionan en ambos modos (dev y prod)
- [ ] He actualizado `AGENTS.md` si cambié convenciones, comandos o arquitectura
- [ ] Las traducciones/i18n están actualizadas en `frontend/src/constants/translations.ts` (si aplica)

## Screenshots / Logs

Si aplica, adjunta capturas o logs relevantes.

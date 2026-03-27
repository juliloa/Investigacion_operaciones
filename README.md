# Investigacion de Operaciones - Guia de Usuario

Aplicacion web para analizar problemas de decision bajo incertidumbre y juegos de suma cero.
Incluye dos modulos principales:

- Modulo de Decision (pasos 1 a 10).
- Modulo de Teoria de Juegos (datos, analisis y metodo algebraico).

## 1. Requisitos e inicio

### Requisitos

- Node.js 18 o superior.
- npm 9 o superior.

### Instalacion y ejecucion

1. Instala dependencias:

```bash
npm install
```

2. Ejecuta en desarrollo:

```bash
npm start
```

3. Genera build de produccion:

```bash
npm run build
```

## 2. Estructura funcional de la aplicacion

La barra lateral separa el trabajo en dos flujos:

- Decision:
  - Paso 1: Datos.
  - Paso 2: Arbol.
  - Paso 3: Sensibilidad.
  - Paso 4: Arbol con valores.
  - Paso 5: Analisis grafico.
  - Paso 6: Grafica.
  - Paso 7: Matriz.
  - Paso 8: Arbol con estudio.
  - Paso 9: Decision.
  - Paso 10: Evaluacion final.
- Teoria del Juego:
  - Paso 1: Datos.
  - Paso 2: Analisis.
  - Paso 3: Metodo algebraico.

## 3. Guia detallada del modulo de Decision

### Paso 1 - Datos

Objetivo:
- Definir alternativas, estados, probabilidades y matriz de pagos.

Como usar:
1. Escribe los nombres de alternativas y estados.
2. Ajusta probabilidades por estado.
3. Completa cada celda de payoff.
4. Usa botones para agregar o eliminar alternativas/estados.

Recomendacion:
- Verifica que las probabilidades representen correctamente tu escenario y que no haya valores vacios relevantes.

### Paso 2 - Arbol

Objetivo:
- Visualizar el arbol de decision base con alternativas y estados.

Como usar:
1. Revisa la estructura del arbol.
2. Confirma que ramas y nodos correspondan a tu matriz de datos.

### Paso 3 - Sensibilidad

Objetivo:
- Entender como cambia el valor esperado de cada alternativa al variar p (probabilidad de estado favorable).

Como usar:
1. Observa pendiente e intercepto de cada alternativa.
2. Identifica cuales alternativas mejoran mas rapido cuando p aumenta.

Interpretacion:
- Pendiente mayor implica mayor sensibilidad al estado favorable.

### Paso 4 - Arbol con valores

Objetivo:
- Integrar calculos de valor esperado en el arbol.

Como usar:
1. Revisa el calculo paso a paso por alternativa.
2. Confirma el total de valor esperado por rama.
3. Identifica la alternativa con mejor resultado.

### Paso 5 - Analisis grafico de puntos de corte

Objetivo:
- Localizar umbrales donde cambia la alternativa optima.

Como usar:
1. Revisa ecuaciones lineales de valor esperado.
2. Observa intersecciones entre alternativas.
3. Interpreta cada interseccion como cambio potencial de decision.

### Paso 6 - Grafica de valor esperado

Objetivo:
- Visualizar lineas de valor esperado en funcion de p.

Como usar:
1. Usa la grafica para comparar alternativas por rango de p.
2. Observa tooltips para ver mejor alternativa en puntos concretos.

### Paso 7 - Matriz del estudio

Objetivo:
- Configurar calidad del estudio de mercado (tasas de acierto/error).

Como usar:
1. Ajusta parametros del estudio.
2. Verifica consistencia entre estado real y senal del estudio.

### Paso 8 - Arbol con estudio

Objetivo:
- Incorporar resultados del estudio al arbol de decision.

Como usar:
1. Revisa ramas condicionadas a senales favorables/desfavorables.
2. Compara valor esperado con y sin estudio.

### Paso 9 - Decision

Objetivo:
- Comparar formalmente la conveniencia de hacer el estudio.

Como usar:
1. Revisa valor esperado sin estudio.
2. Revisa valor esperado con estudio.
3. Interpreta conclusion automatica de conveniencia.

### Paso 10 - Evaluacion final

Objetivo:
- Consolidar resultados y generar reporte.

Como usar:
1. Revisa resumen final de indicadores.
2. Exporta PDF con analisis y conclusiones.

## 4. Guia detallada del modulo de Teoria del Juego

### Paso 1 - Datos del juego

Objetivo:
- Definir matriz de pagos y nombres de estrategias de filas/columnas.

Como usar:
1. Edita nombres de grupos y estrategias.
2. Completa cada pago de la matriz.
3. Revisa maximin y minimax mostrados en la parte inferior.
4. Abre Analisis cuando tengas la matriz lista.

Notas:
- Los datos se guardan de forma persistente para no perder cambios al navegar.

### Paso 2 - Analisis del juego

Objetivo:
- Resolver por punto silla si existe; si no existe, aplicar eliminacion sucesiva por dominancia estricta.

Logica aplicada:
- Si hay punto silla inicial:
  - Se muestra matriz con celda(s) de equilibrio resaltadas.
  - Se muestra grafica del punto silla.
  - No se reduce la matriz.
- Si no hay punto silla:
  - Se intenta eliminar por columna y se alterna por iteraciones.
  - Si en una iteracion no se puede por el eje esperado, se intenta por el eje opuesto.
  - Solo se elimina cuando hay dominancia estricta elemento a elemento:
    - Filas: una fila elimina a otra si es >= en todos los elementos y > en al menos uno.
    - Columnas: una columna elimina a otra si es <= en todos los elementos y < en al menos uno.

Como leer cada paso:
1. Cabecera del paso:
  - Indica si la eliminacion fue por filas o columnas.
2. Texto de intento/aplicacion:
  - Muestra eje intentado y eje finalmente aplicado.
3. Comparacion:
  - Muestra estrategia eliminada vs estrategia dominante con vectores completos.
4. Flujo visual:
  - Rojo: estrategia eliminada.
  - Verde: estrategia que permanece.
5. Matriz antes y despues:
  - Incluye resaltado animado de celdas/headers para facilitar lectura.

### Paso 3 - Metodo algebraico

Objetivo:
- Analizar equilibrio grafico con ecuaciones lineales cuando la matriz final tiene dos columnas.

Que muestra:
1. Matriz final reducida.
2. Ecuaciones por estrategia de fila:
   - y = a*p + b*(1-p) = m*p + c
3. Dos graficas:
  - Grafica completa:
    - Incluye todas las estrategias de fila proyectadas sobre las dos columnas finales.
  - Grafica de matriz final reducida:
    - Incluye solo estrategias supervivientes tras reduccion.
4. Cruces y conclusiones por intervalos de p.

Caso especial 1x1:
- Si la matriz final termina en 1x1, se muestra una grafica puntual del resultado deterministico.

## 5. Recomendaciones de uso

- Trabaja en orden de pasos para mantener coherencia de resultados.
- Si editas datos base, revisa nuevamente pasos de analisis posteriores.
- Antes de compartir resultados, ejecuta un build para validar estado final.

## 6. Solucion de problemas comun

- "No hay grafica algebraica":
  - Verifica que la matriz final tenga exactamente 2 columnas.
- "No se elimina una estrategia":
  - Recuerda que la eliminacion solo procede con dominancia estricta en todos los elementos.
- "No encuentro cambios al volver":
  - El sistema persiste datos, pero conviene refrescar analisis tras editar matriz.

## 7. Scripts disponibles

- `npm start`: modo desarrollo.
- `npm run build`: compilacion de produccion.
- `npm test`: pruebas del proyecto.

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
from sqlalchemy import create_engine, text
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3031"],  # Permitir solicitudes desde el frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión a la base de datos (reemplaza con tus credenciales correctas)
engine = create_engine('postgresql://soporte:1859@localhost:5432/bd_soportetecnico')

# Función auxiliar para ejecutar consultas y devolver resultados
def ejecutar_query(query, params=None):
    with engine.connect() as connection:
        return pd.read_sql_query(query, connection, params=params)
    
@app.get("/")
async def read_root():
    return {"message": "Bienvenido a la API de Soporte Técnico"}
# Endpoint para /api
@app.get("/api")
async def read_api():
    return {"message": "Bienvenido a la API. Usa /api/clientes, /api/solicitudes, etc."}


#CLIENTES
@app.get("/api/estadistico/clientes/total")
async def total_clientes():
    try:
        query = text('SELECT COUNT(*) as total FROM cliente WHERE activo = TRUE')
        df_clientes = ejecutar_query(query)
        total_clientes = int(df_clientes['total'][0])
        return {"total_clientes": total_clientes}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/api/estadistico/clientes/total/filtrar")
async def total_clientes(start: str = '2025-02-01', end: str = '2025-02-28'):
    query = text('''
    SELECT * FROM cliente 
    WHERE activo = TRUE AND fecha_creacion BETWEEN :fecha_inicio AND :fecha_fin
    ''')
    df_clientes = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    
    total_clientes = df_clientes.shape[0]
    return JSONResponse(content={"total_clientes": total_clientes})


@app.get("/api/estadistico/clientes/clasificacion")
async def clasificacion_clientes():
    query = text('''
    SELECT tipo_servicio, COUNT(*) as total 
    FROM cliente 
    WHERE tipo_servicio IN ('Prepago', 'Postpago')
    GROUP BY tipo_servicio
    ''')
    
    df_clasificacion = ejecutar_query(query)
    
    # Convertir el DataFrame a un diccionario
    result = df_clasificacion.to_dict(orient='records')
    
    return JSONResponse(content=result)



#SOLICITUDES O TICKETS ABIERTOS
#SOLICITUDES

# Endpoint para obtener la cantidad de solicitudes asignadas a cada técnico
@app.get("/api/estadistico/solicitudes/por_tecnico")
async def solicitudes_por_tecnico():
    query = text('''
    SELECT 
        t.nombre_tecnico || ' ' || t.apellido_tecnico AS tecnico,
        COALESCE(COUNT(s.codigo_trabajador), 0) AS total_solicitudes
    FROM tecnicos t
    LEFT JOIN solicitudes s 
        ON t.codigo_trabajador = s.codigo_trabajador
        AND s.estado_solicitud IN ('asignado', 'En Proceso', 'Pendiente', 'En Lugar')
    GROUP BY t.nombre_tecnico, t.apellido_tecnico
    ''')
    
    df_tecnicos = pd.read_sql_query(query, engine)
    return JSONResponse(content=df_tecnicos.to_dict(orient='records'))


@app.get("/api/estadistico/solicitudes/estado") #hacerlo con ?estado=completado
async def solicitudes_estado(estado: str):
    query = text('''
    SELECT COUNT(*) as total FROM solicitudes 
    WHERE estado_solicitud = :estado
    ''')
    df_estado = ejecutar_query(query, params={"estado": estado})
    
    return JSONResponse(content={"total_solicitudes": int(df_estado['total'].iloc[0])})  # Convertir a int


@app.get("/api/estadistico/solicitudes/abiertas")  # SOLICITUDES QUE están activas o abiertas en ese momento
async def solicitudes_abiertas():
    query = text('''
    SELECT COUNT(*) as total 
    FROM solicitudes 
    WHERE estado_solicitud IN ('asignado', 'En Proceso', 'Pendiente', 'En Lugar')
    ''')
    df_abiertas = pd.read_sql_query(query, engine)

    # Manejar caso en que no hay registros
    if df_abiertas.empty:
        return JSONResponse(content={"total_solicitudes_abiertas": 0})
    
    # Convertir el valor a int
    total_solicitudes_abiertas = int(df_abiertas['total'].iloc[0])
    
    return JSONResponse(content={"total_solicitudes_abiertas": total_solicitudes_abiertas})



# Endpoint para obtener el número total de solicitudes asignadas en un periodo
@app.get("/api/estadistico/solicitudes/total_por_periodo")  # Filtrar por solicitudes creadas o asignadas en un periodo, usar ?start=2023-01-01&end=2023-12-31
async def total_solicitudes_por_periodo(start: str = Query(...), end: str = Query(...)):
    query = text('''
    SELECT COUNT(*) as total FROM solicitudes
    WHERE fecha_solicitud BETWEEN :fecha_inicio AND :fecha_fin
    ''')
    df_solicitudes = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    # Manejar caso en que no hay registros
    if df_solicitudes.empty:
        return JSONResponse(content={"total_solicitudes": 0})
    return JSONResponse(content={"total_solicitudes": int(df_solicitudes['total'][0])})



#TICKETS
@app.get("/api/estadistico/tickets/total")
async def total_tickets():
    query = text('SELECT COUNT(*) as total FROM tb_crear_ticket')
    df_tickets = ejecutar_query(query)
    
    return JSONResponse(content={"total_tickets": int(df_tickets['total'].iloc[0])})  # Convertir a int



@app.get("/api/estadistico/tickets/motivos")  # Obtener cantidad por cada motivo
async def cantidad_solicitudes_por_motivo():
    query = text('''
        SELECT motivo_visita, COUNT(*) as total_motivo
        FROM tb_crear_ticket
        GROUP BY motivo_visita
    ''')
    df_motivo = pd.read_sql_query(query, engine)
    return df_motivo.to_dict(orient='records')


@app.get("/api/estadistico/tickets/motivos/periodo")  # Filtrar por solicitudes creadas o asignadas en un periodo, usar ?start=2023-01-01&end=2023-12-31
async def total_ticketsmotivo_por_periodo(start: str = Query(...), end: str = Query(...)):
    query = text('''
    SELECT motivo_visita, COUNT(*) as total_motivo
        FROM tb_crear_ticket
        WHERE fecha_creacion BETWEEN :start AND :end
        GROUP BY motivo_visita
    ''')
    df_motivo = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    return JSONResponse(content=df_motivo.to_dict(orient="records"))


# Endpoint para obtener el número de tickets clasificados por prioridad
@app.get("/api/estadistico/tickets/por_prioridad")
async def tickets_por_prioridad():
    query = text('''
    SELECT prioridad_solicitud, COUNT(*) as total_tickets
    FROM tb_crear_ticket
    GROUP BY prioridad_solicitud
    ''')
    df_prioridad = pd.read_sql_query(query, engine)
    return df_prioridad.to_dict(orient='records')

# Endpoint para obtener el número total de tickets sin asignar
@app.get("/api/estadistico/tickets/sin_asignar")
async def tickets_sin_asignar():
    query = text('''
    SELECT COUNT(*) as total FROM tb_crear_ticket
    WHERE codigo_ticket NOT IN (SELECT codigo_ticket FROM solicitudes)
    ''')
    df_tickets = pd.read_sql_query(query, engine)

    # Manejar caso en que no hay registros
    if df_tickets.empty:
        return {"total_tickets_sin_asignar": 0}

    # Convertir el valor a int
    total_tickets_sin_asignar = int(df_tickets['total'].iloc[0])
    
    return {"total_tickets_sin_asignar": total_tickets_sin_asignar}

   



#SOLICITUDES CERRADAS/COMPLETADAS

@app.get("/api/estadistico/solicitudes/cerradas/completadas")  # Número Total completadas/cerradas en cierto periodo
async def solicitudes_cerradas_completadas(start: str = None, end: str = None):
    if start and end:
        query = text('''
        SELECT COUNT(*) as total 
        FROM solicitud_cerrada_completada 
        WHERE fecha_caso_cerrado BETWEEN :fecha_inicio AND :fecha_fin
        ''')
        df_cerradas = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    else:
        query = text('''
        SELECT COUNT(*) as total 
        FROM solicitud_cerrada_completada
        ''')
        df_cerradas = pd.read_sql_query(query, engine)

    # Manejar caso en que no hay registros
    if df_cerradas.empty:
        return JSONResponse(content={"total_solicitudes_cerradas": 0})

    # Convertir el valor a int
    total_solicitudes_cerradas = int(df_cerradas['total'].iloc[0])
    
    return JSONResponse(content={"total_solicitudes_cerradas": total_solicitudes_cerradas})



# Endpoint para obtener el total de soluciones o fallas ejecutadas

@app.get("/api/estadistico/solicitudes/completadas/fallas")  # Obtener total de soluciones por tipo de falla
async def total_soluciones_fallas(solucion_falla: str = Query(...)):
       query = text('''
       SELECT COUNT(*) as total FROM solicitud_cerrada_completada
       WHERE tipo_solucion_falla = :solucion_falla
       ''')
       df_soluciones = pd.read_sql_query(query, engine, params={"solucion_falla": solucion_falla})

       # Manejar caso en que no hay registros
       if df_soluciones.empty:
           return JSONResponse(content={"total_soluciones_fallas": 0})

       # Convertir el valor a int
       total_soluciones_fallas = int(df_soluciones['total'].iloc[0])

       return JSONResponse(content={"total_soluciones_fallas": total_soluciones_fallas})
   



#SOLICITUDES NO REALIZADAS
# Endpoint para filtrar solicitudes por motivo
@app.get("/api/estadistico/solicitudes/no_realizadas/por_motivo")
async def solicitudes_por_motivo(motivo: str = Query(...)):
    query = text('''
    SELECT COUNT(*) as total FROM solicitud_no_realizada
    WHERE motivo_norealizacion = :motivo
    ''')
    df_solicitudes = pd.read_sql_query(query, engine, params={"motivo": motivo})

    # Manejar caso en que no hay registros
    if df_solicitudes.empty:
        return JSONResponse(content={"motivo": motivo, "total_solicitudes": 0})

    # Convertir el valor a int
    total_solicitudes = int(df_solicitudes['total'].iloc[0])

    return JSONResponse(content={"motivo": motivo, "total_solicitudes": total_solicitudes})


# Endpoint para obtener el total de solicitudes no realizadas
@app.get("/api/estadistico/solicitudes/no_realizadas")
async def total_solicitudes_no_realizadas(start: str = None, end: str = None):
    if start and end:
        query = text('''
        SELECT COUNT(*) as total FROM solicitud_no_realizada
        WHERE fecha_cierre_norealizado BETWEEN :fecha_inicio AND :fecha_fin
        ''')
        df_solicitudes = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    else:
        query = text('SELECT COUNT(*) as total FROM solicitud_no_realizada')
        df_solicitudes = pd.read_sql_query(query, engine)
    
# Manejar caso en que no hay registros
    if df_solicitudes.empty:
        return JSONResponse(content={"total_solicitudes_norealizadas": 0})

    # Convertir el valor a int
    total_df_solicitudes_norealizadas = int(df_solicitudes['total'].iloc[0])
    
    return JSONResponse(content={"total_solicitudes_norealizadas": total_df_solicitudes_norealizadas})



@app.get("/api/estadistico/solicitudes/completadas_por_tecnico")
async def solicitudes_completadas_por_tecnico(tecnico: str = None):
    if tecnico:
        query = text('''
        SELECT 
            t.nombre_tecnico || ' ' || t.apellido_tecnico AS tecnico,
            COUNT(*) AS total
        FROM solicitud_cerrada_completada sc
        JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
        JOIN tecnicos t ON t.codigo_trabajador = s.codigo_trabajador
        WHERE sc.estado_solicitud = 'Completado' AND s.codigo_trabajador = :tecnico
        GROUP BY tecnico
        ''')
        df = pd.read_sql_query(query, engine, params={"tecnico": tecnico})
        return df.to_dict(orient='records')[0] if not df.empty else {}
    else:
        query = text('''
        SELECT 
            t.nombre_tecnico || ' ' || t.apellido_tecnico AS tecnico,
            COUNT(*) AS total
        FROM solicitud_cerrada_completada sc
        JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
        JOIN tecnicos t ON t.codigo_trabajador = s.codigo_trabajador
        WHERE sc.estado_solicitud = 'Completado'
        GROUP BY tecnico
        ''')
        df = pd.read_sql_query(query, engine)
        return df.to_dict(orient='records')



    
@app.get("/api/estadistico/solicitudes/no_realizadas_por_tecnico")
async def solicitudes_no_realizadas_por_tecnico(tecnico: str = None):
    if tecnico:
        query = text('''
        SELECT 
            t.nombre_tecnico || ' ' || t.apellido_tecnico AS tecnico,
            COUNT(*) AS total
        FROM solicitud_no_realizada sr
        JOIN solicitudes s ON s.codigo_solicitud = sr.codigo_solicitud
        JOIN tecnicos t ON t.codigo_trabajador = s.codigo_trabajador
        WHERE sr.estado_solicitud = 'No Realizado' AND s.codigo_trabajador = :tecnico
        GROUP BY tecnico
        ''')
        df = pd.read_sql_query(query, engine, params={"tecnico": tecnico})
        return df.to_dict(orient='records')[0] if not df.empty else {}
    else:
        query = text('''
        SELECT 
            t.nombre_tecnico || ' ' || t.apellido_tecnico AS tecnico,
            COUNT(*) AS total
        FROM solicitud_no_realizada sr
        JOIN solicitudes s ON s.codigo_solicitud = sr.codigo_solicitud
        JOIN tecnicos t ON t.codigo_trabajador = s.codigo_trabajador
        WHERE sr.estado_solicitud = 'No Realizado'
        GROUP BY tecnico
        ''')
        df = pd.read_sql_query(query, engine)
        return df.to_dict(orient='records')



#REPORTES
# --- FEEDBACK ---
@app.get("/api/estadistico/feedback/total")
async def total_feedback():
    try:
        query = text('SELECT COUNT(*) as total FROM public.feedback_tecnico_prueba')
        df_feedback = ejecutar_query(query)
        total = int(df_feedback['total'][0])
        return {"total_feedback": total}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# --- EVALUACIONES ---
@app.get("/api/estadistico/evaluaciones/total")
async def total_evaluaciones(start: str = None, end: str = None):
    try:
        # Asumimos que la columna de fecha se llama 'fecha_evaluacion'.
        # ¡Cambia este nombre si es diferente en tu tabla!
        base_query = 'SELECT COUNT(*) as total FROM public.evaluaciones'
        
        if start and end:
            query = text(f"{base_query} WHERE fecha_evaluacion_tecnico BETWEEN :start AND :end")
            df_evaluaciones = ejecutar_query(query, params={"start": start, "end": end})
        else:
            query = text(base_query)
            df_evaluaciones = ejecutar_query(query)

        if df_evaluaciones.empty:
            return {"total_evaluaciones": 0}
            
        total = int(df_evaluaciones['total'][0])
        return {"total_evaluaciones": total}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    



# Endpoint para obtener el total de solicitudes cerradas
@app.get("/api/estadistico/solicitudes/cerradas")
async def total_solicitudes_no_realizadas(start: str = None, end: str = None):
    if start and end:
        query = text('''
        SELECT COUNT(*) as total FROM solicitudes_cerradas
        WHERE fecha_cierre BETWEEN :fecha_inicio AND :fecha_fin
        ''')
        df_solicitudes_cerradas = pd.read_sql_query(query, engine, params={"fecha_inicio": start, "fecha_fin": end})
    else:
        query = text('SELECT COUNT(*) as total FROM solicitudes_cerradas')
        df_solicitudes_cerradas = pd.read_sql_query(query, engine)
    
# Manejar caso en que no hay registros
    if df_solicitudes_cerradas.empty:
        return JSONResponse(content={"total_solicitudes_cerradas": 0})

    # Convertir el valor a int
    total_df_solicitudes_cerradas = int(df_solicitudes_cerradas['total'].iloc[0])
    
    return JSONResponse(content={"total_solicitudes_cerradas": total_df_solicitudes_cerradas})

# Inicia el servidor con: uvicorn main:app --reload

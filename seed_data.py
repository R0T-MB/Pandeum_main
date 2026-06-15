#!/usr/bin/env python3
"""
Pandeum - Seed Data Script (MVP v2.2)
Ejecutar con: python seed_data.py
Requiere: pip install psycopg2-binary python-dotenv
"""

import os
import uuid
import random
from datetime import datetime, timedelta
import psycopg2
import psycopg2.extras
from psycopg2 import sql
from dotenv import load_dotenv

load_dotenv()

# Configuración de conexión (ajusta según tu entorno)
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "pandeum"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

def get_connection():
    psycopg2.extras.register_uuid()
    return psycopg2.connect(**DB_CONFIG)

def seed_users(conn):
    cur = conn.cursor()
    users = []
    
    # Usuario cliente 1
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (str(uuid.uuid4()), "cliente@example.com", "Carlos Gómez", "Bogotá", False, False))
    row = cur.fetchone()
    if row:
        users.append(("cliente@example.com", row[0]))
    
    # Usuario cliente 2 - CORREGIDO: parámetros como tupla
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (str(uuid.uuid4()), "ana@example.com", "Ana Martínez", "Medellín", False, False))
    row = cur.fetchone()
    if row:
        users.append(("ana@example.com", row[0]))
    
    # Usuario proveedor Technology
    tech_provider_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (tech_provider_id, "tecnicolaptop@example.com", "Juan Pérez", "Bogotá", True, False))
    row = cur.fetchone()
    if row:
        users.append(("tecnicolaptop@example.com", row[0]))
        # Insertar en providers solo si el usuario se insertó
        cur.execute("""
            INSERT INTO providers (
                id, business_name, category, subcategory, description, verification_status,
                trust_score, price_min, price_max, location_lat, location_lng,
                response_time_hours, available_now, cases_resolved_similar
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row[0], "Laptop Rescue", "Technology", "Reparación de laptops",
            "Especialistas en gaming y overheat", "verified", 92.5, 50, 120,
            4.6097, -74.0817, 1.5, True, 87
        ))
    
    # Usuario proveedor Home Services
    home_provider_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (home_provider_id, "plomero24@example.com", "Roberto Díaz", "Bogotá", True, False))
    row = cur.fetchone()
    if row:
        users.append(("plomero24@example.com", row[0]))
        cur.execute("""
            INSERT INTO providers (
                id, business_name, category, subcategory, description, verification_status,
                trust_score, price_min, price_max, location_lat, location_lng,
                response_time_hours, available_now, cases_resolved_similar
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row[0], "Plomero 24/7", "Home Services", "Plomería",
            "Emergencias y reparaciones generales", "verified", 88.0, 80, 200,
            4.6243, -74.0638, 0.75, True, 112
        ))
    
    # Usuario proveedor Education
    edu_provider_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
    """, (edu_provider_id, "tutorpro@example.com", "María Fernández", "Medellín", True, False))
    row = cur.fetchone()
    if row:
        users.append(("tutorpro@example.com", row[0]))
        cur.execute("""
            INSERT INTO providers (
                id, business_name, category, subcategory, description, verification_status,
                trust_score, price_min, price_max, location_lat, location_lng,
                response_time_hours, available_now, cases_resolved_similar
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            row[0], "Tutor Pro", "Education", "Matemáticas y programación",
            "Clases particulares online y presenciales", "verified", 96.2, 30, 80,
            6.2442, -75.5812, 2.0, True, 203
        ))
    
    # Usuario admin
    admin_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO users (id, email, full_name, city, is_provider, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO NOTHING
    """, (admin_id, "admin@pandeum.com", "Admin Pandeum", "System", False, True))
    
    conn.commit()
    cur.close()
    print("✅ Usuarios insertados/actualizados.")
    return users

# El resto de las funciones (seed_reviews, seed_conversations_and_feedback,
# seed_user_memory, seed_external_resources, main) se mantienen exactamente igual.

def seed_reviews(conn, users_map):
    cur = conn.cursor()
    # Obtener IDs de proveedores
    cur.execute("SELECT id FROM providers")
    provider_ids = [row[0] for row in cur.fetchall()]
    if not provider_ids:
        print("⚠️ No hay proveedores para reseñas.")
        return
    # Obtener IDs de clientes (no proveedores)
    cur.execute("SELECT id FROM users WHERE is_provider = false")
    client_ids = [row[0] for row in cur.fetchall()]
    if not client_ids:
        print("⚠️ No hay clientes para reseñas.")
        return
    
    reviews_data = [
        (client_ids[0], provider_ids[0], 5, "Excelente técnico, resolvió mi problema rápido."),
        (client_ids[0], provider_ids[1], 4, "Buen trabajo, aunque un poco caro."),
        (client_ids[1], provider_ids[0], 5, "Muy profesional. Lo recomiendo."),
        (client_ids[1], provider_ids[2], 5, "La mejor tutora de matemáticas."),
    ]
    for user_id, provider_id, rating, comment in reviews_data:
        cur.execute("""
            INSERT INTO reviews (user_id, provider_id, rating, comment, review_verification_status)
            VALUES (%s, %s, %s, %s, 'verified')
            ON CONFLICT DO NOTHING
        """, (user_id, provider_id, rating, comment))
    conn.commit()
    cur.close()
    print("✅ Reseñas insertadas.")

def seed_conversations_and_feedback(conn, users_map):
    cur = conn.cursor()
    # Obtener un cliente y un proveedor
    cur.execute("SELECT id FROM users WHERE is_provider = false LIMIT 1")
    client_row = cur.fetchone()
    if not client_row:
        return
    user_id = client_row[0]
    
    # Ejemplo de conversación
    ai_response_example = {
        "diagnosis": {"possible_causes": ["Sobrecalentamiento", "Pasta térmica seca"]},
        "instant_solutions": ["Limpiar ventiladores", "Usar base refrigerante"],
        "providers": [{"provider_id": str(uuid.uuid4()), "reason": "Especialista en gaming"}],
        "confidence_score": 0.92
    }
    cur.execute("""
        INSERT INTO conversations (user_id, problem_text, ai_response, ai_confidence_score, category, subcategory, urgency)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        user_id,
        "Mi laptop se apaga después de 20 minutos jugando",
        psycopg2.extras.Json(ai_response_example),
        0.92,
        "Technology",
        "Reparación de laptops",
        "medium"
    ))
    conv_id = cur.fetchone()[0]
    
    # Insertar feedback dummy
    cur.execute("SELECT id FROM providers LIMIT 1")
    provider_row = cur.fetchone()

    if provider_row:
        provider_id = provider_row[0]

        cur.execute("""
            INSERT INTO recommendation_feedback (
                conversation_id,
                provider_id,
                user_clicked
            )
            VALUES (%s, %s, %s)
        """, (
            conv_id,
            provider_id,
            True
        ))

    conn.commit()
    cur.close()
    print("✅ Conversaciones y feedback insertados.")

def seed_user_memory(conn, users_map):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE is_provider = false LIMIT 1")
    row = cur.fetchone()
    if row:
        user_id = row[0]
        context = {
            "known_devices": ["laptop Asus ROG"],
            "preferred_categories": ["Technology"],
            "budget_range": [50, 150]
        }
        cur.execute("""
            INSERT INTO user_memory (user_id, context_data)
            VALUES (%s, %s)
            ON CONFLICT (user_id) DO UPDATE SET context_data = EXCLUDED.context_data, updated_at = NOW()
        """, (user_id, psycopg2.extras.Json(context)))
        conn.commit()
    cur.close()
    print("✅ Memoria de usuario insertada.")

def seed_external_resources(conn):
    cur = conn.cursor()
    resources = [
        ("Technology", "Laptop overheating", "Cómo limpiar el ventilador de tu laptop", "https://youtu.be/example", "video"),
        ("Home Services", "Plumbing", "Cómo reparar una fuga menor", "https://example.com/plumbing-guide", "guide"),
        ("Education", "Calculus", "Khan Academy - Calculus", "https://khanacademy.org/calculus", "article"),
    ]
    for cat, subcat, title, url, rtype in resources:
        cur.execute("""
            INSERT INTO external_resources (category, subcategory, title, url, resource_type)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
        """, (cat, subcat, title, url, rtype))
    conn.commit()
    cur.close()
    print("✅ Recursos externos insertados.")

def main():
    print("🌱 Sembrando datos de prueba para Pandeum...")

    conn = get_connection()

    try:
        users_map = seed_users(conn)

        seed_reviews(conn, users_map)
        seed_conversations_and_feedback(conn, users_map)
        seed_user_memory(conn, users_map)
        seed_external_resources(conn)

        print("✅ Seed completado correctamente.")

    finally:
        conn.close()


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
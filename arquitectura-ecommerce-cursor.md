# Especificación Técnica de Arquitectura: E-Commerce Next.js + Payload CMS + Mercado Pago (Argentina 2026)

Este documento contiene la arquitectura completa, modelos de datos, endpoints de API y vistas de frontend diseñados para ser procesados directamente por el IDE **Cursor** utilizando **Cursor Composer (Ctrl + I)** o el panel de Chat.

---

## 1. Estructura de Carpetas del Proyecto

```text
├── src/
│   ├── app/
│   │   ├── (app)/                  # Rutas del Frontend de la Tienda
│   │   │   ├── page.tsx            # Home / Catálogo de Productos
│   │   │   ├── carrito/
│   │   │   │   └── page.tsx        # Interfaz de Carrito y Envío (React Component)
│   │   │   └── layout.tsx
│   │   ├── (cms)/                  # Panel de Control Visual para el Cliente
│   │   │   └── admin/[[...segments]]/
│   │   │       └── page.tsx        # Inicialización de Payload CMS Admin
│   │   └── api/                    # Serverless Functions (Backend)
│   │       ├── checkout/
│   │       │   └── route.ts        # Generador de Preferencias de Mercado Pago
│   │       ├── shipping/
│   │       │   └── route.ts        # Cotizador de Envíos (Envíopack / Correo API)
│   │       └── webhooks/
│   │           └── mercadopago/
│   │               └── route.ts    # Procesador de Notificaciones de Pago e Inyección IPN
│   ├── collections/                # Definición de Colecciones de Payload CMS
│   │   ├── Products.ts             # Esquema de Productos y Variantes
│   │   ├── Orders.ts               # Esquema de Órdenes e Historial de Pagos
│   │   └── Media.ts                # Gestión de Multimedia (Cloudinary / Vercel Blob)
│   ├── payload.config.ts           # Configuración Central de Payload CMS 3.x
│   └── components/
│       └── CarritoView.tsx         # Componente interactivo del checkout dinámico
├── .env.local                      # Variables de Entorno del Entorno Local
└── package.json                    # Dependencias Node.js del Proyecto
```

---

## 2. Modelos de Datos para Payload CMS 3.x

### `src/collections/Products.ts`
```typescript
import { CollectionConfig } from 'payload/types';

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'stock', 'status'],
  },
  access: {
    read: () => true, // Público para el catálogo
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Nombre del Producto' },
    { name: 'description', type: 'richText', label: 'Descripción' },
    { name: 'price', type: 'number', required: true, label: 'Precio (ARS)' },
    { name: 'stock', type: 'number', required: true, min: 0, label: 'Stock Disponible' },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true, label: 'Fotos del Producto' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
      required: true,
    },
    { name: 'weight', type: 'number', required: true, label: 'Peso en gramos (Para cotizar envío)' },
  ],
};
```

### `src/collections/Orders.ts`
```typescript
import { CollectionConfig } from 'payload/types';

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'customerName', 'total', 'paymentStatus', 'createdAt'],
  },
  access: {
    create: () => true, // Permitir compras desde el frontend público
    read: ({ req: { user } }) => Boolean(user), // Solo administradores ven las órdenes
  },
  fields: [
    {
      name: 'paymentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pendiente de Pago', value: 'pending' },
        { label: 'Aprobado', value: 'approved' },
        { label: 'Rechazado / Cancelado', value: 'rejected' },
      ],
      required: true,
      admin: { readOnly: true },
    },
    { name: 'customerName', type: 'text', required: true, label: 'Nombre del Cliente' },
    { name: 'customerEmail', type: 'email', required: true, label: 'Email de Contacto' },
    { name: 'customerPhone', type: 'text', required: true, label: 'Teléfono' },
    {
      name: 'shippingAddress',
      type: 'group',
      label: 'Dirección de Entrega (Argentina)',
      fields: [
        { name: 'street', type: 'text', required: true, label: 'Calle y Número' },
        { name: 'floorAppart', type: 'text', label: 'Piso / Departamento (Opcional)' },
        { name: 'city', type: 'text', required: true, label: 'Localidad / Ciudad' },
        { name: 'province', type: 'text', required: true, label: 'Provincia' },
        { name: 'zipCode', type: 'text', required: true, label: 'Código Postal' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos Comprados',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true },
        { name: 'priceAtPurchase', type: 'number', required: true, label: 'Precio Unitario Congelado' },
      ],
    },
    { name: 'shippingCost', type: 'number', required: true, label: 'Costo de Envío Abonado' },
    { name: 'total', type: 'number', required: true, label: 'Total General de la Orden' },
    { name: 'mpPreferenceId', type: 'text', label: 'ID Preferencia Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'mpPaymentId', type: 'text', label: 'ID Transacción Mercado Pago', admin: { position: 'sidebar' } },
    { name: 'trackingNumber', type: 'text', label: 'Número de Tracking Logístico', admin: { position: 'sidebar' } },
  ],
};
```

### `src/collections/Media.ts` (Almacenamiento Cloudinary Integration)
```typescript
import { CollectionConfig } from 'payload/types';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: 'Texto Alternativo (SEO)' },
  ],
};
```

---

## 3. Endpoints de la API (Serverless Functions)

### `src/app/api/checkout/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import getPayload from 'payload';
import config from '@/payload.config';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

export async function POST(req: Request) {
  try {
    const { items, customer, shippingAddress, shippingCost } = await req.json();
    const payload = await getPayload({ config });

    // 1. Validar e inyectar precios reales desde la base de datos para evitar alteraciones en el cliente
    const validatedItems = await Promise.all(
      items.map(async (item: any) => {
        const prod = await payload.findByID({ collection: 'products', id: item.productId });
        if (!prod || prod.stock < item.quantity) throw new Error(`Stock insuficiente para ${prod?.title}`);
        return {
          id: prod.id,
          title: prod.title,
          quantity: item.quantity,
          unit_price: prod.price,
          currency_id: 'ARS'
        };
      })
    );

    // 2. Calcular el total general de la operación
    const productsTotal = validatedItems.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0);
    const totalOrderAmount = productsTotal + shippingCost;

    // 3. Crear el registro preliminar de la orden en Payload CMS (Estado: Pendiente)
    const orderRecord = await payload.create({
      collection: 'orders',
      data: {
        paymentStatus: 'pending',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: shippingAddress,
        items: items.map((i: any, index: number) => ({
          product: i.productId,
          quantity: i.quantity,
          priceAtPurchase: validatedItems[index].unit_price
        })),
        shippingCost: shippingCost,
        total: totalOrderAmount,
      }
    });

    // 4. Compilar items para la pasarela Mercado Pago incluyendo la tarifa de envío
    const mpItems = [...validatedItems];
    if (shippingCost > 0) {
      mpItems.push({
        id: 'shipping_cost_fee',
        title: 'Costo de Envío a Domicilio',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'ARS'
      });
    }

    // 5. Configurar preferencia en Mercado Pago vinculando el ID de orden local en external_reference
    const preference = new Preference(client);
    const mpResponse = await preference.create({
      body: {
        items: mpItems,
        payer: { name: customer.name, email: customer.email },
        external_reference: orderRecord.id.toString(),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SERVER_URL}/carrito?status=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_WEBHOOK_URL}/api/webhooks/mercadopago`,
      }
    });

    // 6. Actualizar la orden con el PreferenceID generado
    await payload.update({
      collection: 'orders',
      id: orderRecord.id,
      data: { mpPreferenceId: mpResponse.id }
    });

    return NextResponse.json({ init_point: mpResponse.init_point, preferenceId: mpResponse.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno de checkout' }, { status: 500 });
  }
}
```

### `src/app/api/shipping/route.ts`
```typescript
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { zipCode, totalWeight } = await req.json();

    if (!zipCode || zipCode.length < 4) {
      return NextResponse.json({ error: 'Código postal inválido' }, { status: 400 });
    }

    // Simulación de respuesta de integración logística local (Ej. Envíopack / Andreani API)
    // En producción sustituir por llamadas tipo fetch("https://api.enviopack.com/...", { ... })
    const baseCost = 4500; 
    const weightSurcharge = Math.ceil(totalWeight / 1000) * 850;
    
    // Matriz de distribución por código postal aproximado en Argentina
    let regionalMultiplier = 1.0;
    const prefix = parseInt(zipCode.substring(0, 2));

    if (prefix >= 10 && prefix <= 14) regionalMultiplier = 0.9; // AMBA
    else if (prefix >= 16 && prefix <= 18) regionalMultiplier = 1.0; // Resto de BsAs
    else regionalMultiplier = 1.6; // Interior / Patagonia / NOA

    const finalShippingCost = Math.round((baseCost + weightSurcharge) * regionalMultiplier);

    const deliveryOptions = [
      {
        id: 'standard_home',
        name: 'Envío Estándar a Domicilio',
        cost: finalShippingCost,
        eta: '3 a 6 días hábiles'
      },
      {
        id: 'express_home',
        name: 'Envío Express prioritario',
        cost: Math.round(finalShippingCost * 1.45),
        eta: '24 a 48 horas hágiles'
      }
    ];

    return NextResponse.json({ options: deliveryOptions });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cotizar logística de envíos' }, { status: 500 });
  }
}
```

---

## 4. Frontend Interactiva de Compra

### `src/components/CarritoView.tsx`
```typescript
'use client';

import React, { useState, useEffect } from 'react';

export default function CarritoView({ cartItemsData }: { cartItemsData: any[] }) {
  const [cart, setCart] = useState<any[]>(cartItemsData);
  const [zipCode, setZipCode] = useState('');
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [address, setAddress] = useState({ street: '', floorAppart: '', city: '', province: '' });

  const productsTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalWeight = cart.reduce((acc, item) => acc + ((item.weight || 500) * item.quantity), 0);
  const grandTotal = productsTotal + (selectedShipping ? selectedShipping.cost : 0);

  const handleCalculateShipping = async () => {
    if (!zipCode) return;
    setLoadingShipping(true);
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode, totalWeight }),
      });
      const data = await res.json();
      if (data.options) {
        setShippingOptions(data.options);
        setSelectedShipping(data.options[0]); // Por defecto selecciona la opción estándar
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipping) return alert('Por favor calcula y selecciona una opción de envío');
    
    setIsProcessingCheckout(true);
    try {
      const checkoutPayload = {
        items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        customer,
        shippingAddress: { ...address, zipCode },
        shippingCost: selectedShipping.cost
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });
      
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point; // Redirección directa nativa a Checkout Pro
      } else {
        throw new Error(data.error || 'Fallo de procesamiento');
      }
    } catch (err: any) {
      alert(`Error en Checkout: ${err.message}`);
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
      {/* Columna Izquierda: Carrito e Info de Envío */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Tu Carrito de Compras</h2>
        <div className="border rounded-lg p-4 bg-white shadow-sm divide-y">
          {cart.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                <p className="text-sm text-gray-500">Cantidad: {item.quantity} x ${item.price.toLocaleString('es-AR')}</p>
              </div>
              <span className="font-medium text-gray-900">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>

        {/* Módulo Logístico */}
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <h3 className="font-bold text-gray-800 text-lg">Calcular Envío (Argentina)</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código Postal (ej: 1425)"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="border px-3 py-2 rounded flex-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button
              onClick={handleCalculateShipping}
              disabled={loadingShipping}
              className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loadingShipping ? 'Calculando...' : 'Calcular'}
            </button>
          </div>

          {shippingOptions.length > 0 && (
            <div className="space-y-2 mt-3">
              {shippingOptions.map((opt) => (
                <label key={opt.id} className="flex items-center justify-between p-2 border rounded bg-white cursor-pointer hover:bg-gray-50 text-black">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping"
                      checked={selectedShipping?.id === opt.id}
                      onChange={() => setSelectedShipping(opt)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{opt.name}</p>
                      <p className="text-xs text-gray-500">Plazo: {opt.eta}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-gray-900">${opt.cost.toLocaleString('es-AR')}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Formulario de Datos del Cliente y Pago */}
      <form onSubmit={handleCheckout} className="space-y-6 bg-white p-6 border rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Datos de Facturación y Entrega</h2>
        
        <div className="space-y-3">
          <input required type="text" placeholder="Nombre y Apellido completo" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
          <input required type="email" placeholder="Correo Electrónico" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
          <input required type="tel" placeholder="Teléfono celular (con código de área)" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Dirección Física</h4>
          <input required type="text" placeholder="Calle, Número, Localidad" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
          <input type="text" placeholder="Piso / Depto / Oficina (Opcional)" value={address.floorAppart} onChange={e => setAddress({...address, floorAppart: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
          <div className="grid grid-cols-2 gap-2">
            <input required type="text" placeholder="Ciudad" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
            <input required type="text" placeholder="Provincia" value={address.province} onChange={e => setAddress({...address, province: e.target.value})} className="w-full border px-3 py-2 rounded text-sm text-black" />
          </div>
        </div>

        {/* Resumen Final de Costos */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal Productos:</span>
            <span>${productsTotal.toLocaleString('es-AR')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Costo de Envío:</span>
            <span>{selectedShipping ? `$${selectedShipping.cost.toLocaleString('es-AR')}` : 'A calcular'}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
            <span>Total General:</span>
            <span>${grandTotal.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessingCheckout || cart.length === 0}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-base shadow hover:bg-emerald-700 transition disabled:bg-gray-400"
        >
          {isProcessingCheckout ? 'Procesando Transacción...' : 'Pagar con Mercado Pago'}
        </button>
      </form>
    </div>
  );
}
```

---

## 5. Archivo de Configuración de Entorno (`.env.local`)

```env
# URL de Servidor (Utilizar localhost en desarrollo local, URL de Vercel en Producción)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_WEBHOOK_URL=https://tu-tunel-ngrok.ngrok-free.app

# Clave secreta para cookies de encriptación de Payload CMS
PAYLOAD_SECRET=UN_STRING_ALEATORIO_Y_MUY_SEGURO_DE_MINIMO_32_CARACTERES

# Base de datos relacional Postgres (Neon.tech / Supabase Tier Gratuito)
DATABASE_URI=postgres://usuario:password@host-pooler.neon.tech/dbname?sslmode=require

# Credenciales de API Oficiales de Mercado Pago Argentina
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXX-XXXXXX-XXXXXX-XXXXXX

# Configuración de Cloudinary para almacenamiento masivo de imágenes del CMS
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## 6. Prompts de Automatización para el Compositor de Cursor (Ctrl + I)

Copia y pega individualmente los siguientes enunciados dentro del chat de **Cursor** para que autogenere las piezas faltantes manteniendo cohesión de código:

### Prompt A: Programación del Webhook de Pagos (Mercado Pago IPN)
> **Instrucción para Cursor:** *"Basándote en mi estructura actual de código y el archivo de órdenes `src/collections/Orders.ts`, crea el archivo del Webhook asincrónico en `src/app/api/webhooks/mercadopago/route.ts`. Este endpoint debe procesar solicitudes tipo POST de Mercado Pago, capturar el query parameter `data.id` (Payment ID), realizar una llamada fetch segura a la API oficial de Mercado Pago para verificar que el estado sea 'approved', buscar la orden correspondiente usando el campo `external_reference`, cambiar su estado de pago a 'approved', almacenar el ID de pago real en `mpPaymentId`, y finalmente reducir de forma transaccional el inventario de stock de los ítems implicados en la colección de `products` de Payload CMS. Asegúrate de añadir manejo de errores robusto y responder con status 200 para evitar reintentos de red por parte de Mercado Pago."*

### Prompt B: Integración del Media Upload Plugin con Cloudinary u Objeto S3
> **Instrucción para Cursor:** *"Configura el archivo raíz `src/payload.config.ts` importando las colecciones `Products`, `Orders` y `Media`. Adicionalmente, integra el plugin oficial de Payload CMS para almacenamiento en la nube (como payload-cloudinary-plugin o @payloadcms/plugin-cloud-storage) mapeando las credenciales especificadas en `.env.local` al esquema de `Media` de manera que todas las imágenes subidas por el cliente se almacenen fuera de Vercel para respetar los límites del plan Hobby de forma segura."*

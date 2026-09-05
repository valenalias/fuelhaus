/* ============================================
   FUELHAUS — Sistema bilingüe (ES/EN)
   Español es el idioma principal (target real:
   comunidad hispana de Miami). El inglés es una
   capa opcional que el usuario activa a mano; la
   elección se recuerda en localStorage.
============================================ */

const I18N = {
  es: {
    nav: {
      como_funciona: 'Cómo funciona',
      planes: 'Planes',
      nosotros: 'Nosotros',
      contacto: 'Contacto',
      miembros: 'Miembros',
      elige_plan: 'Elige tu plan',
    },

    hero: {
      eyebrow: 'Meal prep · Miami, FL',
      title_line1: 'Tu semana,',
      title_line2: 'resuelta.',
      sub: 'Comida diseñada para tu cuerpo y tus metas. Preparada con ingredientes de primera, lista para comer. En tu puerta cada domingo.',
      cta_planes: 'Ver los planes',
      cta_como: 'Cómo funciona',
      proof1_num: '35–50g',
      proof1_label: 'proteína por porción',
      proof2_num: 'Sin',
      proof2_label: 'conservantes',
      proof3_num: 'Entrega',
      proof3_label: 'cada domingo',
      img_alt: 'Mujer sonriendo con un bowl Fuelhaus de pollo grillado, quinoa y vegetales, en una terraza de Miami',
      badge_line: 'Tu comida',
      badge_big: 'Lista.',
      badge_sub: 'Personalizada · Fresca · Natural',
    },

    badges: {
      protein: 'Alta proteína',
      organic: '100% orgánico',
      no_preservatives: 'Sin conservantes',
      delivery: 'Entrega cada domingo',
      custom: '100% personalizado',
      ready: 'Listo para comer',
    },

    strip: {
      quote_html: '"Ingredientes reales,<br>cocinados esta semana,<br><em>en tu puerta el domingo."</em>',
      tag1: 'Sin procesar',
      tag2: 'Sin conservantes',
      tag3: 'Alta proteína',
    },

    process: {
      eyebrow: 'El proceso',
      title_html: 'Tres pasos.<br><em>Toda la semana.</em>',
      step1_title: 'Nos cuentas',
      step1_p: 'Objetivos, gustos, alergias y rutina. Con esa información construimos tu plan exacto — no uno genérico.',
      step2_title: 'Cocinamos',
      step2_p: 'Ingredientes frescos y orgánicos, seleccionados con criterio. Cada macro calculado. Nada improvisado.',
      step3_title: 'Recibes el domingo',
      step3_p: 'Tu semana entera, en una sola entrega. Abres, calientas y comes. Así de simple es comer bien.',
    },

    menu: {
      eyebrow: 'Antes de elegir',
      title_html: 'Así llega<br><em>tu semana.</em>',
      sub: 'Fotos reales de pedidos entregados. Sin retoques, sin promesas que no cumplimos.',
      card1_alt: 'Variedad de proteínas y vegetales de la semana',
      card1_label: 'Variedad de la semana',
      card2_alt: 'Semana completa con activate shots',
      card2_label: 'Tu semana + Activate shots',
    },

    plans: {
      eyebrow: 'Los planes',
      title_html: 'Encontrá<br><em>el tuyo.</em>',
      sub: '35–50g de proteína por porción. Sin conservantes, sin procesados. Entrega cada domingo en Miami. Solo eliges cuánto quieres cubrir.',
      per_week: '/ semana',
      most_chosen: 'Más elegido',
      structure_name: 'Structure',
      structure_desc: 'Para quien quiere organizar sus almuerzos sin pensar. Consistencia simple, resultados reales.',
      structure_cta: 'Elegir Structure',
      structure_i1: '5 almuerzos',
      structure_i2: '5 activate shots',
      performance_name: 'Performance',
      performance_desc: 'Almuerzos y cenas de alta proteína bajo control. El plan de quienes van en serio con sus objetivos.',
      performance_cta: 'Elegir Performance',
      performance_i1: '5 almuerzos',
      performance_i2: '5 cenas',
      performance_i3: '5 activate shots',
      full_system_name: 'Full System',
      full_system_desc: 'Tu semana cubierta por completo. Sin improvisaciones, sin compromisos. El sistema definitivo.',
      full_system_cta: 'Elegir Full System',
      full_system_i1: '5 almuerzos',
      full_system_i2: '5 cenas',
      full_system_i3: '5 activate shots',
      full_system_i4: '3 snacks',
      full_week_badge: 'El más completo',
      full_week_name: 'Full Week',
      full_week_tagline: 'Your full week, fueled.',
      full_week_desc: 'Para no fallarte nunca: tu semana entera resuelta, sin vueltas.',
      full_week_cta: 'Elegir Full Week',
      full_week_i1: '15 comidas',
      full_week_i2: '7 activate shots',
      full_week_regular_label: 'Valor regular',
      full_week_savings: 'Ahorrás $39/semana',
      note_html: 'Cada plan se adapta a tus objetivos, gustos y alergias. Sin excepciones. <a href="#contacto">Habla con nosotros →</a>',
    },

    compare: {
      title: 'Compará en detalle',
      row_price: 'Precio por semana',
      row_lunches: 'Almuerzos',
      row_dinners: 'Cenas',
      row_shots: 'Activate shots',
      row_snacks: 'Snacks',
      row_macros: 'Personalizado por macros',
      row_delivery: 'Entrega cada domingo',
    },

    trust: {
      area: 'Entrega en toda el área de Miami',
      membership: 'Membresía mensual',
      cancel: 'Cancelás hasta una semana antes del primer domingo del mes',
    },

    gallery: {
      alt: 'Doce comidas Fuelhaus de la semana, vista superior',
    },

    food: {
      alt: 'Comidas Fuelhaus con activate shots sobre la mesada',
      eyebrow: 'Lo que comes',
      title_html: 'Real. Fresca.<br><em>Sin vueltas.</em>',
      p1: 'Ingredientes de primera calidad, preparados esa misma semana. Sin conservantes, sin procesados. Lo que tu cuerpo merece, en la cantidad exacta que necesita.',
      p2: 'Proteína, carbohidratos y grasas calibrados para tu objetivo específico. No es comida genérica — es tu comida.',
      tag1: 'Sin conservantes',
      tag2: 'Alta proteína',
      tag3: 'Orgánico',
      tag4: 'Sin gluten disponible',
    },

    about: {
      eyebrow: 'Nosotros',
      title_html: 'Consistencia<br><em>es todo.</em>',
      p1: 'Fuelhaus nació en Miami de la mano de personal trainers y nutricionistas que vivían el mismo problema todos los días: entrenar en serio y comer bien no deberían depender de cuánto tiempo te queda en la semana. Diseñamos cada plan con el mismo criterio que usamos con nuestros propios clientes de entrenamiento — macros reales, ingredientes reales, cero relleno.',
      p2: 'Cada semana ayudamos a decenas de personas a mantener su plan sin esfuerzo, sin excusas y sin comprometer ni un gramo de calidad.',
      stat1_num: '50+',
      stat1_label: 'Clientes activos',
      stat2_num: '100%',
      stat2_label: 'Ingredientes frescos',
      stat3_num: '0',
      stat3_label: 'Excusas para fallar',
      img_alt: 'Entrenamiento de fuerza, la base detrás del criterio de Fuelhaus',
    },

    cta: {
      eyebrow: 'Empezá esta semana',
      title_html: 'Tu semana, <em>resuelta.</em>',
      sub: 'Déjanos tus datos y armamos tu plan. Sin compromiso, sin complicaciones.',
      name_placeholder: 'Tu nombre',
      email_placeholder: 'Tu email',
      submit: 'Quiero empezar',
      note: 'O escríbenos directamente:',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
    },

    footer: {
      copyright: 'Fuelhaus &reg; 2025 — Meal prep premium en Miami, FL.',
      tagline: 'Comida real · Entrega cada domingo · Miami, FL',
    },

    whatsapp_float_aria: 'Escribinos por WhatsApp',

    /* ── login.html ─────────────────────────────────────────────── */
    login: {
      left_heading_html: 'Tu semana,<br><em>resuelta.</em>',
      tag1: 'Alta proteína',
      tag2: '100% orgánico',
      tag3: 'Entrega cada domingo',
      tag4: 'Sin conservantes',
      left_footer: 'Fuelhaus &reg; 2025 · Meal prep premium · Miami, FL',
      tab_login: 'Ingresar',
      tab_register: 'Crear cuenta',
      login_title: 'Bienvenido de vuelta',
      login_sub: 'Ingresá con tu email y contraseña.',
      label_email: 'Email',
      label_password: 'Contraseña',
      login_btn: 'Ingresar',
      login_btn_loading: 'Ingresando…',
      forgot_link: '¿Olvidaste tu contraseña?',
      forgot_title: 'Recuperar acceso',
      forgot_sub: 'Todavía no mandamos el reset por email automático — dejanos tu email y te ayudamos a recuperarlo por WhatsApp.',
      forgot_btn: 'Solicitar ayuda',
      forgot_btn_loading: 'Enviando…',
      forgot_success_msg: '¡Listo! Escribinos por WhatsApp y te ayudamos a recuperar el acceso al toque.',
      forgot_whatsapp_btn: 'Escribir por WhatsApp',
      forgot_whatsapp_msg: 'Hola! Olvidé mi contraseña de la cuenta {email} y necesito ayuda para recuperar el acceso.',
      forgot_back: '← Volver a ingresar',
      register_title: 'Creá tu cuenta',
      register_sub: 'Registrate para gestionar tu plan.',
      label_name: 'Nombre completo',
      name_placeholder: 'Juan Pérez',
      email_placeholder: 'tu@email.com',
      password_placeholder_min: 'Mínimo 6 caracteres',
      register_btn: 'Crear cuenta',
      register_btn_loading: 'Creando cuenta…',
      back_link: '← Volver al sitio',
    },

    /* ── home.html (onboarding / checkout / cuenta) ────────────────── */
    home: {
      logout: 'Salir',
      progress_plan: 'Plan',
      progress_meals: 'Comidas',
      progress_data: 'Datos',
      progress_prefs: 'Preferencias',
      progress_payment: 'Pago',

      account_eyebrow: 'Mi cuenta',
      account_title_fallback: 'Tu pedido',
      account_sub: 'Aquí está el resumen de tu pedido activo.',
      account_greeting_prefix: '¡Hola, ',
      header_greeting_prefix: 'Hola, ',
      label_plan: 'Plan',
      label_price: 'Precio',
      label_date: 'Fecha',
      label_coupon: 'Cupón',
      label_goal: 'Objetivo',
      label_diet: 'Dieta',
      label_allergies: 'Alergias / restricciones',
      label_avoid: 'Alimentos a evitar',
      label_whatsapp: 'WhatsApp',
      label_email: 'Email',
      label_subscription: 'Suscripción',
      no_coupon: 'Sin cupón',
      none_f: 'Ninguna',
      none_m: 'Ninguno',
      contact_fuelhaus: 'Comunicarme con Fuelhaus',
      manage_subscription: 'Gestionar mi suscripción',
      sub_status_active: 'Activa — próximo cobro el {date}',
      sub_status_canceling: 'Se cancela el {date} — hasta esa fecha seguís recibiendo tus entregas ya pagadas',
      sub_status_canceled: 'Cancelada',
      err_portal: 'No se pudo abrir la gestión de suscripción. Probá de nuevo o escribinos por WhatsApp.',
      back_to_site: '← Volver al sitio',
      whatsapp_account_msg: 'Hola! Tengo el pedido número {order} y quería consultarte algo.',

      welcome_eyebrow: 'Bienvenido a Fuelhaus',
      welcome_greeting_prefix: '¡Hola, ',
      welcome_sub_html: 'Estás a cinco pasos de tener tu semana de comida resuelta.<br>Todo fresco, personalizado y listo para comer.',
      w_step1: 'Elegís tu plan',
      w_step2: 'Armás tu semana',
      w_step3: 'Completás tus datos',
      w_step4: 'Configurás tus preferencias',
      w_step5: 'Confirmás tu pedido',
      start_btn: 'Empezar',

      step1_of_5: 'Paso 1 de 5',
      plans_title_html: 'Elige tu <em>plan</em>',
      plans_sub: 'Todos incluyen 35–50g de proteína por porción. Ingredientes frescos, sin conservantes, entrega dominical.',
      most_chosen: 'Más elegido',
      per_week: ' / semana',
      per_week_suffix: '/sem',
      structure_name: 'Structure',
      structure_i1: '5 almuerzos semanales',
      structure_i2: '5 activate shots',
      structure_i3: 'Personalizado por macros',
      structure_i4: 'Entrega el domingo',
      structure_cta: 'Elegir Structure',
      performance_name: 'Performance',
      performance_i1: '5 almuerzos semanales',
      performance_i2: '5 cenas semanales',
      performance_i3: '5 activate shots',
      performance_i4: 'Personalizado por macros',
      performance_i5: 'Entrega el domingo',
      performance_cta: 'Elegir Performance',
      full_system_name: 'Full System',
      full_system_i1: '5 almuerzos semanales',
      full_system_i2: '5 cenas semanales',
      full_system_i3: '5 activate shots',
      full_system_i4: '3 snacks semanales',
      full_system_i5: 'Personalizado por macros',
      full_system_i6: 'Entrega el domingo',
      full_system_cta: 'Elegir Full System',
      most_complete: 'El más completo',
      full_week_name: 'Full Week',
      full_week_i1: '15 comidas semanales',
      full_week_i2: '7 activate shots',
      full_week_i3: 'Personalizado por macros',
      full_week_i4: 'Entrega el domingo',
      full_week_cta: 'Elegir Full Week',
      full_week_regular_label: 'Valor regular',
      full_week_savings: 'Ahorrás $39/semana',
      back: 'Atrás',
      click_plan_hint: 'Hacé clic en el plan para seleccionarlo',

      step2_of_5: 'Paso 2 de 5',
      meals_title_html: 'Arma tu <em>semana</em>',
      meals_sub: 'Elegí exactamente {count} comidas para tu plan. Repetí las que quieras.',
      meals_progress_line: '{selected} de {total} comidas seleccionadas',
      meals_remaining_btn: '{n} comidas restantes',
      err_meals_incomplete: 'Completá tu selección de comidas antes de continuar',

      step3_of_5: 'Paso 3 de 5',
      data_title_html: 'Tus datos de <em>contacto</em>',
      data_sub: 'Así sabemos a quién entregarle las comidas y por dónde comunicarnos.',
      label_first_name: 'Nombre *',
      first_name_placeholder: 'Juan',
      label_last_name: 'Apellido *',
      last_name_placeholder: 'Pérez',
      label_email_field: 'Email',
      email_hint: 'Este es el email de tu cuenta',
      label_phone: 'WhatsApp *',
      phone_placeholder: '+1 (305) 000-0000',
      phone_hint: 'Lo usamos para coordinar tu entrega del domingo',
      continue: 'Continuar',

      step4_of_5: 'Paso 4 de 5',
      prefs_title_html: 'Configura tus <em>comidas</em>',
      prefs_sub: 'Con esta información preparamos comidas que se adaptan exactamente a tu cuerpo y objetivos.',
      goal_question: '¿Cuál es tu objetivo? *',
      goal_fat_loss_name: 'Perder grasa',
      goal_fat_loss_desc: 'Déficit calórico con alta proteína',
      goal_muscle_gain_name: 'Ganar músculo',
      goal_muscle_gain_desc: 'Superávit moderado, proteína elevada',
      goal_maintenance_name: 'Mantenerme',
      goal_maintenance_desc: 'Balance exacto para tu composición',
      goal_healthy_name: 'Comer saludable',
      goal_healthy_desc: 'Nutrición equilibrada para sentirte mejor',
      diet_question: '¿Seguís algún tipo de dieta?',
      diet_none: 'Sin preferencia especial',
      diet_high_protein: 'Alta proteína',
      diet_low_carb: 'Baja en carbohidratos',
      diet_keto: 'Keto',
      diet_vegan: 'Vegano',
      diet_vegetarian: 'Vegetariano',
      diet_paleo: 'Paleo',
      diet_mediterranean: 'Mediterránea',
      allergies_question: '¿Tenés alergias o restricciones alimentarias?',
      allergies_placeholder: "Ej: lactosa, gluten, maní... o escribí 'Ninguna'",
      avoid_question: '¿Qué alimentos preferís evitar?',
      avoid_placeholder: 'Ej: brócoli, picante, mariscos...',

      step5_of_5: 'Paso 5 de 5',
      payment_title_html: 'Confirmá tu <em>pedido</em>',
      payment_sub: 'Revisá el resumen y confirmá. ¡Ya casi está!',
      summary_title: 'Resumen del pedido',
      summary_plan: 'Plan seleccionado',
      summary_weekly_price: 'Precio semanal',
      summary_discount_label: 'Descuento',
      summary_total: 'Total',
      coupon_label: 'Cupón de descuento',
      coupon_placeholder: 'TUCODIGO',
      coupon_apply: 'Aplicar',
      coupon_applying: '…',
      coupon_applied_prefix: '✓ ',
      coupon_applied_suffix: ' de descuento aplicado',
      confirm_order: 'Confirmar pedido',
      confirming: 'Confirmando…',
      payment_disclaimer: 'Al confirmar activás el cobro automático semanal de tu plan (cada martes), con entrega dominical en Miami. Podés cancelar cuando quieras desde tu cuenta — si cancelás antes del martes, no se te cobra ni se prepara nada esa semana.',

      confirmed_eyebrow: '¡Pedido confirmado!',
      confirmed_title_html: 'Tu semana está <em>resuelta.</em>',
      confirmed_sub: 'Guardá tu número de pedido para cualquier consulta.',
      confirmed_li1: 'Recibes tus comidas el próximo domingo',
      confirmed_li2: 'Todo fresco, preparado esa semana',
      confirmed_li3: 'Avisanos por WhatsApp que ya abonaste',
      confirmed_whatsapp_btn: 'Avisar que ya pagué',
      whatsapp_confirm_msg: 'Ya aboné mi pedido número {order}',

      processing_eyebrow: 'Confirmando tu pago…',
      processing_title: 'Ya casi está',
      processing_sub: 'Esto puede tardar unos segundos, no cierres esta página.',

      status_paid: 'Pagado',
      status_processing: 'En proceso',
      status_delivered: 'Entregado',
      status_cancelled: 'Cancelado',

      err_required_fields: 'Completá todos los campos obligatorios',
      err_select_goal: 'Seleccioná tu objetivo antes de continuar',
      err_confirm_order: 'Error al confirmar el pedido',
      err_invalid_coupon: 'Cupón inválido',
      err_payment_processing: 'Tu pago se está confirmando y está tardando más de lo normal. Si el cargo se hizo, tu pedido va a aparecer en unos minutos — refrescá esta página o avisanos por WhatsApp.',
      checkout_cancelled_msg: 'Cancelaste el pago. Podés revisar el resumen y volver a intentarlo cuando quieras.',
    },

    /* Mapea mensajes de error que devuelve el servidor (siempre en
       español, server.js no se tradujo) a su versión en inglés, para
       que un usuario navegando en EN no vea un error suelto en ES. */
    api_errors: {},
  },

  en: {
    nav: {
      como_funciona: 'How it works',
      planes: 'Plans',
      nosotros: 'About',
      contacto: 'Contact',
      miembros: 'Members',
      elige_plan: 'Choose your plan',
    },

    hero: {
      eyebrow: 'Meal prep · Miami, FL',
      title_line1: 'Your week,',
      title_line2: 'solved.',
      sub: 'Food designed for your body and your goals. Made with premium ingredients, ready to eat. On your doorstep every Sunday.',
      cta_planes: 'See the plans',
      cta_como: 'How it works',
      proof1_num: '35–50g',
      proof1_label: 'protein per serving',
      proof2_num: 'No',
      proof2_label: 'preservatives',
      proof3_num: 'Delivery',
      proof3_label: 'every Sunday',
      img_alt: 'Smiling woman holding a Fuelhaus bowl with grilled chicken, quinoa and vegetables, on a Miami terrace',
      badge_line: 'Your food',
      badge_big: 'Ready.',
      badge_sub: 'Custom · Fresh · Natural',
    },

    badges: {
      protein: 'High protein',
      organic: '100% organic',
      no_preservatives: 'No preservatives',
      delivery: 'Delivery every Sunday',
      custom: '100% customized',
      ready: 'Ready to eat',
    },

    strip: {
      quote_html: '"Real ingredients,<br>cooked this week,<br><em>at your door on Sunday."</em>',
      tag1: 'Unprocessed',
      tag2: 'No preservatives',
      tag3: 'High protein',
    },

    process: {
      eyebrow: 'The process',
      title_html: 'Three steps.<br><em>Your whole week.</em>',
      step1_title: 'You tell us',
      step1_p: 'Goals, preferences, allergies and routine. With that we build your exact plan — not a generic one.',
      step2_title: 'We cook',
      step2_p: 'Fresh, organic ingredients, chosen with care. Every macro calculated. Nothing improvised.',
      step3_title: 'You get it Sunday',
      step3_p: 'Your whole week, in a single delivery. Open, heat and eat. That simple to eat well.',
    },

    menu: {
      eyebrow: 'Before you choose',
      title_html: 'This is how<br><em>your week arrives.</em>',
      sub: 'Real photos of delivered orders. No retouching, no promises we can\'t keep.',
      card1_alt: 'Variety of proteins and vegetables for the week',
      card1_label: 'Weekly variety',
      card2_alt: 'Full week with activate shots',
      card2_label: 'Your week + Activate shots',
    },

    plans: {
      eyebrow: 'The plans',
      title_html: 'Find<br><em>your fit.</em>',
      sub: '35–50g of protein per serving. No preservatives, no processed food. Delivery every Sunday in Miami. You only choose how much you want covered.',
      per_week: '/ week',
      most_chosen: 'Most chosen',
      structure_name: 'Structure',
      structure_desc: 'For anyone who wants their lunches sorted without thinking. Simple consistency, real results.',
      structure_cta: 'Choose Structure',
      structure_i1: '5 lunches',
      structure_i2: '5 activate shots',
      performance_name: 'Performance',
      performance_desc: 'High-protein lunches and dinners, handled. The plan for people who are serious about their goals.',
      performance_cta: 'Choose Performance',
      performance_i1: '5 lunches',
      performance_i2: '5 dinners',
      performance_i3: '5 activate shots',
      full_system_name: 'Full System',
      full_system_desc: 'Your whole week covered. No improvising, no compromises. The definitive system.',
      full_system_cta: 'Choose Full System',
      full_system_i1: '5 lunches',
      full_system_i2: '5 dinners',
      full_system_i3: '5 activate shots',
      full_system_i4: '3 snacks',
      full_week_badge: 'The most complete',
      full_week_name: 'Full Week',
      full_week_tagline: 'Your full week, fueled.',
      full_week_desc: 'So it never lets you down — your whole week, fully solved.',
      full_week_cta: 'Choose Full Week',
      full_week_i1: '15 meals',
      full_week_i2: '7 activate shots',
      full_week_regular_label: 'Regular value',
      full_week_savings: 'Save $39/week',
      note_html: 'Every plan adapts to your goals, taste and allergies. No exceptions. <a href="#contacto">Talk to us →</a>',
    },

    compare: {
      title: 'Compare in detail',
      row_price: 'Price per week',
      row_lunches: 'Lunches',
      row_dinners: 'Dinners',
      row_shots: 'Activate shots',
      row_snacks: 'Snacks',
      row_macros: 'Customized by macros',
      row_delivery: 'Delivery every Sunday',
    },

    trust: {
      area: 'Delivery across the Miami area',
      membership: 'Monthly membership',
      cancel: 'Cancel up to a week before the first Sunday of the month',
    },

    gallery: {
      alt: 'Twelve Fuelhaus meals for the week, top view',
    },

    food: {
      alt: 'Fuelhaus meals with activate shots on the counter',
      eyebrow: 'What you eat',
      title_html: 'Real. Fresh.<br><em>No fuss.</em>',
      p1: 'Top-quality ingredients, prepared that same week. No preservatives, no processed food. What your body deserves, in the exact amount it needs.',
      p2: 'Protein, carbs and fats calibrated for your specific goal. Not generic food — it\'s your food.',
      tag1: 'No preservatives',
      tag2: 'High protein',
      tag3: 'Organic',
      tag4: 'Gluten-free available',
    },

    about: {
      eyebrow: 'About us',
      title_html: 'Consistency<br><em>is everything.</em>',
      p1: 'Fuelhaus was born in Miami from personal trainers and nutritionists who lived the same problem every day: training hard and eating well shouldn\'t depend on how much time you have left in the week. We design every plan with the same standard we use with our own training clients — real macros, real ingredients, zero filler.',
      p2: 'Every week we help dozens of people stick to their plan effortlessly, without excuses and without compromising a single gram of quality.',
      stat1_num: '50+',
      stat1_label: 'Active clients',
      stat2_num: '100%',
      stat2_label: 'Fresh ingredients',
      stat3_num: '0',
      stat3_label: 'Excuses to fail',
      img_alt: 'Strength training, the foundation behind Fuelhaus\'s standard',
    },

    cta: {
      eyebrow: 'Start this week',
      title_html: 'Your week, <em>solved.</em>',
      sub: 'Leave us your info and we\'ll build your plan. No commitment, no hassle.',
      name_placeholder: 'Your name',
      email_placeholder: 'Your email',
      submit: 'I want to start',
      note: 'Or write to us directly:',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
    },

    footer: {
      copyright: 'Fuelhaus &reg; 2025 — Premium meal prep in Miami, FL.',
      tagline: 'Real food · Delivery every Sunday · Miami, FL',
    },

    whatsapp_float_aria: 'Message us on WhatsApp',

    login: {
      left_heading_html: 'Your week,<br><em>solved.</em>',
      tag1: 'High protein',
      tag2: '100% organic',
      tag3: 'Delivery every Sunday',
      tag4: 'No preservatives',
      left_footer: 'Fuelhaus &reg; 2025 · Premium meal prep · Miami, FL',
      tab_login: 'Log in',
      tab_register: 'Create account',
      login_title: 'Welcome back',
      login_sub: 'Log in with your email and password.',
      label_email: 'Email',
      label_password: 'Password',
      login_btn: 'Log in',
      login_btn_loading: 'Logging in…',
      forgot_link: 'Forgot your password?',
      forgot_title: 'Recover access',
      forgot_sub: "We don't send automatic email resets yet — leave us your email and we'll help you recover it over WhatsApp.",
      forgot_btn: 'Request help',
      forgot_btn_loading: 'Sending…',
      forgot_success_msg: "Done! Message us on WhatsApp and we'll help you get back in right away.",
      forgot_whatsapp_btn: 'Message on WhatsApp',
      forgot_whatsapp_msg: 'Hi! I forgot my password for the account {email} and need help getting access back.',
      forgot_back: '← Back to log in',
      register_title: 'Create your account',
      register_sub: 'Sign up to manage your plan.',
      label_name: 'Full name',
      name_placeholder: 'John Smith',
      email_placeholder: 'you@email.com',
      password_placeholder_min: 'At least 6 characters',
      register_btn: 'Create account',
      register_btn_loading: 'Creating account…',
      back_link: '← Back to site',
    },

    home: {
      logout: 'Log out',
      progress_plan: 'Plan',
      progress_meals: 'Meals',
      progress_data: 'Info',
      progress_prefs: 'Preferences',
      progress_payment: 'Payment',

      account_eyebrow: 'My account',
      account_title_fallback: 'Your order',
      account_sub: 'Here\'s the summary of your active order.',
      account_greeting_prefix: 'Hi, ',
      header_greeting_prefix: 'Hi, ',
      label_plan: 'Plan',
      label_price: 'Price',
      label_date: 'Date',
      label_coupon: 'Coupon',
      label_goal: 'Goal',
      label_diet: 'Diet',
      label_allergies: 'Allergies / restrictions',
      label_avoid: 'Foods to avoid',
      label_whatsapp: 'WhatsApp',
      label_email: 'Email',
      label_subscription: 'Subscription',
      no_coupon: 'No coupon',
      none_f: 'None',
      none_m: 'None',
      contact_fuelhaus: 'Contact Fuelhaus',
      manage_subscription: 'Manage my subscription',
      sub_status_active: 'Active — next charge on {date}',
      sub_status_canceling: 'Cancels on {date} — you\'ll still get your deliveries already paid for until then',
      sub_status_canceled: 'Canceled',
      err_portal: 'Couldn\'t open subscription management. Try again or message us on WhatsApp.',
      back_to_site: '← Back to site',
      whatsapp_account_msg: 'Hi! I have order number {order} and wanted to ask about something.',

      welcome_eyebrow: 'Welcome to Fuelhaus',
      welcome_greeting_prefix: 'Hi, ',
      welcome_sub_html: 'You\'re five steps away from having your week of food solved.<br>All fresh, customized and ready to eat.',
      w_step1: 'Choose your plan',
      w_step2: 'Build your week',
      w_step3: 'Fill in your info',
      w_step4: 'Set your preferences',
      w_step5: 'Confirm your order',
      start_btn: 'Get started',

      step1_of_5: 'Step 1 of 5',
      plans_title_html: 'Choose your <em>plan</em>',
      plans_sub: 'All plans include 35–50g of protein per serving. Fresh ingredients, no preservatives, Sunday delivery.',
      most_chosen: 'Most chosen',
      per_week: ' / week',
      per_week_suffix: '/wk',
      structure_name: 'Structure',
      structure_i1: '5 weekly lunches',
      structure_i2: '5 activate shots',
      structure_i3: 'Customized by macros',
      structure_i4: 'Sunday delivery',
      structure_cta: 'Choose Structure',
      performance_name: 'Performance',
      performance_i1: '5 weekly lunches',
      performance_i2: '5 weekly dinners',
      performance_i3: '5 activate shots',
      performance_i4: 'Customized by macros',
      performance_i5: 'Sunday delivery',
      performance_cta: 'Choose Performance',
      full_system_name: 'Full System',
      full_system_i1: '5 weekly lunches',
      full_system_i2: '5 weekly dinners',
      full_system_i3: '5 activate shots',
      full_system_i4: '3 weekly snacks',
      full_system_i5: 'Customized by macros',
      full_system_i6: 'Sunday delivery',
      full_system_cta: 'Choose Full System',
      most_complete: 'Most complete',
      full_week_name: 'Full Week',
      full_week_i1: '15 weekly meals',
      full_week_i2: '7 activate shots',
      full_week_i3: 'Customized by macros',
      full_week_i4: 'Sunday delivery',
      full_week_cta: 'Choose Full Week',
      full_week_regular_label: 'Regular value',
      full_week_savings: 'Save $39/week',
      back: 'Back',
      click_plan_hint: 'Click a plan to select it',

      step2_of_5: 'Step 2 of 5',
      meals_title_html: 'Build your <em>week</em>',
      meals_sub: 'Choose exactly {count} meals for your plan. Repeat any as many times as you like.',
      meals_progress_line: '{selected} of {total} meals selected',
      meals_remaining_btn: '{n} meals remaining',
      err_meals_incomplete: 'Complete your meal selection before continuing',

      step3_of_5: 'Step 3 of 5',
      data_title_html: 'Your <em>contact</em> info',
      data_sub: 'This is how we know who to deliver to and how to reach you.',
      label_first_name: 'First name *',
      first_name_placeholder: 'John',
      label_last_name: 'Last name *',
      last_name_placeholder: 'Smith',
      label_email_field: 'Email',
      email_hint: 'This is your account email',
      label_phone: 'WhatsApp *',
      phone_placeholder: '+1 (305) 000-0000',
      phone_hint: 'We use this to coordinate your Sunday delivery',
      continue: 'Continue',

      step4_of_5: 'Step 4 of 5',
      prefs_title_html: 'Set up your <em>meals</em>',
      prefs_sub: 'With this info we prepare meals that fit your body and goals exactly.',
      goal_question: 'What\'s your goal? *',
      goal_fat_loss_name: 'Lose fat',
      goal_fat_loss_desc: 'Calorie deficit with high protein',
      goal_muscle_gain_name: 'Build muscle',
      goal_muscle_gain_desc: 'Moderate surplus, high protein',
      goal_maintenance_name: 'Maintain',
      goal_maintenance_desc: 'Exact balance for your body composition',
      goal_healthy_name: 'Eat healthy',
      goal_healthy_desc: 'Balanced nutrition to feel your best',
      diet_question: 'Do you follow a specific diet?',
      diet_none: 'No special preference',
      diet_high_protein: 'High protein',
      diet_low_carb: 'Low carb',
      diet_keto: 'Keto',
      diet_vegan: 'Vegan',
      diet_vegetarian: 'Vegetarian',
      diet_paleo: 'Paleo',
      diet_mediterranean: 'Mediterranean',
      allergies_question: 'Do you have any allergies or dietary restrictions?',
      allergies_placeholder: "E.g: lactose, gluten, peanuts... or write 'None'",
      avoid_question: 'Any foods you\'d rather avoid?',
      avoid_placeholder: 'E.g: broccoli, spicy food, shellfish...',

      step5_of_5: 'Step 5 of 5',
      payment_title_html: 'Confirm your <em>order</em>',
      payment_sub: 'Review the summary and confirm. Almost there!',
      summary_title: 'Order summary',
      summary_plan: 'Selected plan',
      summary_weekly_price: 'Weekly price',
      summary_discount_label: 'Discount',
      summary_total: 'Total',
      coupon_label: 'Discount coupon',
      coupon_placeholder: 'YOURCODE',
      coupon_apply: 'Apply',
      coupon_applying: '…',
      coupon_applied_prefix: '✓ ',
      coupon_applied_suffix: ' discount applied',
      confirm_order: 'Confirm order',
      confirming: 'Confirming…',
      payment_disclaimer: 'By confirming you activate automatic weekly billing for your plan (every Tuesday), with Sunday delivery in Miami. You can cancel anytime from your account — cancel before Tuesday and you won\'t be charged or prepped for that week.',

      confirmed_eyebrow: 'Order confirmed!',
      confirmed_title_html: 'Your week is <em>solved.</em>',
      confirmed_sub: 'Save your order number for any questions.',
      confirmed_li1: 'You\'ll get your meals next Sunday',
      confirmed_li2: 'Everything fresh, prepared that week',
      confirmed_li3: 'Let us know on WhatsApp once you\'ve paid',
      confirmed_whatsapp_btn: 'Let us know I\'ve paid',
      whatsapp_confirm_msg: 'I just paid for my order number {order}',

      processing_eyebrow: 'Confirming your payment…',
      processing_title: 'Almost there',
      processing_sub: 'This can take a few seconds, don\'t close this page.',

      status_paid: 'Paid',
      status_processing: 'Processing',
      status_delivered: 'Delivered',
      status_cancelled: 'Cancelled',

      err_required_fields: 'Please fill in all required fields',
      err_select_goal: 'Select your goal before continuing',
      err_confirm_order: 'Error confirming the order',
      err_invalid_coupon: 'Invalid coupon',
      err_payment_processing: 'Your payment is still confirming and it\'s taking longer than usual. If the charge went through, your order will show up in a few minutes — refresh this page or message us on WhatsApp.',
      checkout_cancelled_msg: 'You cancelled the payment. You can review the summary and try again whenever you want.',
    },

    api_errors: {
      'No autorizado': 'Not authorized',
      'Sesión expirada': 'Session expired',
      'Solo administradores': 'Admins only',
      'Nombre, email y contraseña son obligatorios': 'Name, email and password are required',
      'La contraseña debe tener al menos 6 caracteres': 'Password must be at least 6 characters',
      'Ya existe una cuenta con ese email': 'An account with that email already exists',
      'Error del servidor': 'Server error',
      'Email y contraseña son obligatorios': 'Email and password are required',
      'Email o contraseña incorrectos': 'Incorrect email or password',
      'Usuario no encontrado': 'User not found',
      'Código requerido': 'Code required',
      'Cupón inválido o inactivo': 'Invalid or inactive coupon',
      'Este cupón ya alcanzó su límite de usos': 'This coupon has reached its usage limit',
      'Plan inválido': 'Invalid plan',
      'Número de WhatsApp requerido': 'WhatsApp number required',
      'Selección de comidas inválida': 'Invalid meal selection',
      'Email requerido': 'Email required',
      'Todavía no tenés una suscripción activa': 'You don\'t have an active subscription yet',
      'Pedido no encontrado': 'Order not found',
      'Los pagos todavía no están configurados': 'Payments are not set up yet',
    },
  },
};

/* ── Motor ────────────────────────────────────────────────────────── */

(function () {
  function getLang() {
    return localStorage.getItem('fh_lang') || 'es';
  }

  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }

  /** Traduce una clave "seccion.clave" al idioma activo. Uso desde JS. */
  window.t = function t(path, vars) {
    const lang = getLang();
    let str = get(I18N[lang], path);
    if (str === undefined) str = get(I18N.es, path);
    if (str === undefined) return path;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace('{' + k + '}', vars[k]);
      });
    }
    return str;
  };

  /** Traduce un mensaje de error crudo devuelto por la API (siempre en
      español) a inglés si el idioma activo es EN; si no hay mapeo
      conocido, devuelve el mensaje original tal cual. */
  window.tApiError = function tApiError(msg) {
    if (getLang() !== 'en' || !msg) return msg;
    return I18N.en.api_errors[msg] || msg;
  };

  function applyToDom(lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = get(I18N[lang], el.getAttribute('data-i18n'));
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const val = get(I18N[lang], el.getAttribute('data-i18n-html'));
      if (val !== undefined) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const val = get(I18N[lang], el.getAttribute('data-i18n-placeholder'));
      if (val !== undefined) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const val = get(I18N[lang], el.getAttribute('data-i18n-alt'));
      if (val !== undefined) el.setAttribute('alt', val);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const val = get(I18N[lang], el.getAttribute('data-i18n-aria'));
      if (val !== undefined) el.setAttribute('aria-label', val);
    });
    document.documentElement.lang = lang === 'en' ? 'en' : 'es-US';
    /* El selector muestra "ES / EN" siempre visibles, marcando cuál está
       activo — mostrar solo el idioma "al que cambiás" confundía, porque
       parecía indicar el idioma actual en vez de la acción del botón. */
    document.querySelectorAll('.lang-toggle [data-lang]').forEach((btn) => {
      const isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('fh:langchange', { detail: { lang } }));
  }

  window.setLanguage = function setLanguage(lang) {
    if (lang !== 'es' && lang !== 'en') lang = 'es';
    localStorage.setItem('fh_lang', lang);
    applyToDom(lang);
  };

  window.currentLang = getLang;

  document.addEventListener('DOMContentLoaded', () => {
    applyToDom(getLang());
    document.querySelectorAll('.lang-toggle [data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
    });
  });
})();

# Academia — academia.wbmonster.com.br

Landing page dark & energética. Stack: Astro 5 + Tailwind v4 + Framer Motion.

**Brief:** Academia (Transforme corpo e mente) · Av. Brasil, 403 - Parque das Nações, Santo André - SP · Tel (01) 19470-8842 · Cores #DC2626 / #F97316 · Tipografia Oswald + Roboto

**Seções:** Navbar fixa · Hero fullscreen · Modalidades (6 cards) · Galeria de Fotos (lightbox) · Planos (3) · Sobre · Contato (form → WhatsApp) · Footer · WhatsApp flutuante fixo.

**Requisitos atendidos:** mobile-first, WCAG AA, animações Framer Motion, CTA único "Entrar em contato" → `wa.me/551194708842`, WhatsApp flutuante, sem seção de promoções.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/
```

Deploy Dokku: `dokku apps:create academia && dokku domains:add academia academia.wbmonster.com.br && git push dokku main && dokku letsencrypt:enable academia`

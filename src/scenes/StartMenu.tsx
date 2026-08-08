export function StartMenu({ hasSave, onNew, onLoad, onCredits }: { hasSave: boolean; onNew: () => void; onLoad: () => void; onCredits: () => void }) {
  return <main className="start-scene">
    <div className="start-sky"><i className="start-moon"></i><i className="start-building building-one"></i><i className="start-building building-two"></i><i className="start-building building-three"></i></div>
    <section className="start-menu">
      <small>BUENOS AIRES - 2026</small>
      <h1>REBUSQUE</h1>
      <p>Un tycoon de reventa, barrio y logística.</p>
      <div className="start-actions">
        <button className="primary" onClick={onNew}>NUEVA PARTIDA</button>
        <button disabled={!hasSave} onClick={onLoad}>{hasSave ? 'CARGAR PARTIDA' : 'SIN PARTIDA GUARDADA'}</button>
      </div>
      <button className="credits-link" onClick={onCredits}>CRÉDITOS</button>
    </section>
    <nav className="start-socials" aria-label="Enlaces del proyecto"><a href="https://github.com/" target="_blank" rel="noreferrer">GH</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">in</a><a href="https://example.com/" target="_blank" rel="noreferrer">WEB</a></nav>
  </main>
}

export function OpeningStory({ onContinue }: { onContinue: () => void }) {
  return <main className="opening-scene">
    <section className="opening-card">
      <small>BUENOS AIRES - LUNES, 08:00</small>
      <h1>Todo empieza con tus ahorros.</h1>
      <p>Tenés <strong>$150.000</strong>. Es lo que pudiste guardar después de años de trabajos cortos, cuentas ajustadas y promesas de que el mes que viene iba a ser distinto.</p>
      <p>Vas a convertir una pieza, un celular y una bici en un negocio de reventa. Comprá bien, cumplí con la gente y hacete un nombre barrio por barrio.</p>
      <p className="opening-note">No hay atajos mágicos: hay decisiones, pedidos y una ciudad entera para aprender a recorrer.</p>
      <button className="primary" onClick={onContinue}>ABRIR MI NEGOCIO &gt;</button>
    </section>
  </main>
}

export function Credits({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop credits-backdrop"><section className="credits-card"><header><small>CRÉDITOS</small><button onClick={onClose}>X</button></header><h2>REBUSQUE</h2><p>Diseño, desarrollo y producción: proyecto independiente.</p><p>Arte y sistemas: pixel-art, economía, logística y narrativa barrial.</p><footer>Hecho en Buenos Aires para aprender a crecer sin perder el barrio.</footer></section></div>
}

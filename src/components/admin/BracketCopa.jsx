import React from 'react';

// Tarjeta para un partido individual dentro del bracket
const MatchCard = ({ partido, onConfirmar }) => {
    const { 
        goles_local, goles_visitante, 
        nombre_local, escudo_local, 
        nombre_visitante, escudo_visitante 
    } = partido;

    const haTerminado = partido.estado === 'aprobado';
    // Un partido necesita confirmación si está pendiente pero ya tiene un resultado cargado por un DT
    const necesitaConfirmacion = onConfirmar && partido.estado === 'pendiente' && partido.goles_local != null;
    const ganadorLocal = haTerminado && goles_local > goles_visitante;
    const ganadorVisitante = haTerminado && goles_local < goles_visitante;

    const teamClass = (isWinner) => 
        `flex items-center justify-between p-2 rounded text-sm ${isWinner ? 'bg-green-500/20 font-bold text-white' : 'bg-gray-700 text-gray-300'}`;

    return (
        <div className="bg-gray-800 rounded-lg p-2 shadow-md w-64 space-y-2 relative">
            <div className={teamClass(ganadorLocal)}>
                <div className="flex items-center truncate">
                    {escudo_local && <img src={escudo_local} alt={nombre_local || ''} className="w-5 h-5 mr-2 rounded-full flex-shrink-0" />}
                    <span className="truncate">{nombre_local || 'Por definir'}</span>
                </div>
                {haTerminado && <span className="font-mono text-base">{goles_local}</span>}
            </div>
            <div className={teamClass(ganadorVisitante)}>
                <div className="flex items-center truncate">
                    {escudo_visitante && <img src={escudo_visitante} alt={nombre_visitante || ''} className="w-5 h-5 mr-2 rounded-full flex-shrink-0" />}
                    <span className="truncate">{nombre_visitante || 'Por definir'}</span>
                </div>
                {haTerminado && <span className="font-mono text-base">{goles_visitante}</span>}
            </div>
            {/* El botón de confirmar solo aparece si se pasa la función y el partido lo requiere */}
            {necesitaConfirmacion && (
                 <button 
                    onClick={() => onConfirmar(partido)}
                    className="absolute -top-2 -right-2 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                    title="Confirmar Resultado"
                >
                    ✓
                </button>
            )}
        </div>
    );
};

// Componente principal del Bracket
function BracketCopa({ fixture, onConfirmarPartido }) {
    // Definimos el orden de las fases para mostrarlas correctamente
    const FASES_ORDENADAS = [
        'Octavos de Final', 
        'Cuartos de Final', 
        'Semifinales', 
        'Final'
    ].filter(fase => fixture && fixture[fase]); // Solo mostramos las fases que existen

    if (!fixture || FASES_ORDENADAS.length === 0) {
        return <p className="text-white text-center p-4">El fixture de esta copa aún no está disponible.</p>;
    }

    return (
        <div className="flex space-x-6 p-4 overflow-x-auto bg-gray-900/50 rounded-lg">
            {FASES_ORDENADAS.map(fase => (
                <div key={fase} className="flex flex-col space-y-8 items-center flex-shrink-0">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 whitespace-nowrap">{fase}</h3>
                    <div className="flex flex-col space-y-12 justify-around h-full">
                        {fixture[fase]?.map(partido => (
                            <MatchCard key={partido.id} partido={partido} onConfirmar={onConfirmarPartido} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BracketCopa;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

// --- Componente Modal para Noticias ---
const NoticiaModal = ({ noticia, onClose }) => {
    if (!noticia) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b border-gray-600 pb-3">
                        <h3 className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'var(--font-heading)' }}>{noticia.titulo}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    {noticia.imagen_url && (
                        <img 
                            src={`${import.meta.env.VITE_API_URL}${noticia.imagen_url}`} 
                            alt={noticia.titulo}
                            // ✅ CAMBIO: de 'object-cover' a 'object-contain' para que la imagen se vea completa
                            className="mt-4 w-full h-auto max-h-96 object-contain rounded-md"
                        />
                    )}
                    <div className="mt-4 text-gray-300 prose prose-invert max-h-[60vh] overflow-y-auto">
                        <p>{noticia.contenido}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente de Carrusel Animado ---
const ScrollingTicker = ({ items, renderItem, heightClass = 'h-48' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) return;

        const intervalId = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
        }, 4000);

        return () => clearInterval(intervalId);
    }, [items]);

    return (
        <div className={`relative overflow-hidden ${heightClass}`}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className="absolute w-full transition-transform duration-1000"
                    style={{ transform: `translateY(${(index - currentIndex) * 100}%)` }}
                >
                    {renderItem(item)}
                </div>
            ))}
        </div>
    );
};


function HomePage() {
    const [ligas, setLigas] = useState([]);
    const [ultimosResultados, setUltimosResultados] = useState([]);
    const [ultimasNoticias, setUltimasNoticias] = useState([]);
    const [ultimosFichajes, setUltimosFichajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
    const { usuario, token } = useAuth();

    const fetchHomePageData = async () => {
        try {
            const [ligasRes, resultadosRes, noticiasRes, fichajesRes] = await Promise.all([
                api.get('/ligas/publico'),
                api.get('/partidos/publico/recientes'),
                api.get('/noticias?limite=5'),
                api.get('/stats/ultimos-fichajes?limite=10')
            ]);
            setLigas(ligasRes.data);
            setUltimosResultados(resultadosRes.data);
            setUltimasNoticias(noticiasRes.data);
            setUltimosFichajes(fichajesRes.data);
        } catch (err) {
            setError('No se pudo conectar con el servidor para cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomePageData();
    }, []);

    const handleBorrarNoticia = async (noticiaId, e) => {
        e.stopPropagation();
        if (window.confirm("¿Estás seguro de que quieres borrar esta noticia?")) {
            try {
                await api.delete(`/noticias/${noticiaId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success("Noticia borrada con éxito.");
                fetchHomePageData();
            } catch (err) {
                toast.error(err.response?.data?.error || "Error al borrar la noticia.");
            }
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando plataforma...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;

    return (
        <>
            <NoticiaModal noticia={noticiaSeleccionada} onClose={() => setNoticiaSeleccionada(null)} />
            
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div 
                    className="text-center mb-12 p-16 rounded-xl border border-gray-700 shadow-2xl" 
                    style={{
                        backgroundImage: `url('https://placehold.co/1200x400/111827/111827/png?text=.')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 sm:text-6xl" style={{ fontFamily: 'var(--font-heading)' }}>
                        Liga de Leyendas
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl p-6">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Noticias</h3>
                            <div className="space-y-4">
                                {ultimasNoticias.length > 0 ? (
                                    ultimasNoticias.map(noticia => (
                                        <div key={noticia.id} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer flex justify-between items-center" onClick={() => setNoticiaSeleccionada(noticia)}>
                                            <div>
                                                <p className="font-semibold text-white">{noticia.titulo}</p>
                                                <p className="text-sm text-gray-400">{new Date(noticia.fecha).toLocaleDateString()}</p>
                                            </div>
                                            {usuario && usuario.rol === 'admin' && (
                                                <button 
                                                    onClick={(e) => handleBorrarNoticia(noticia.id, e)}
                                                    className="text-red-500 hover:text-red-400 p-2 rounded-full"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : <p className="text-gray-500">No hay noticias publicadas.</p>}
                            </div>
                        </div>

                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl p-6">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Últimos Resultados</h3>
                            <ScrollingTicker 
                                items={ultimosResultados}
                                heightClass="h-24"
                                renderItem={(partido) => (
                                    <div className="flex items-center justify-between p-3">
                                        <span className="w-2/5 text-right font-semibold text-gray-300">{partido.nombre_local}</span>
                                        <Link to={`/partidos/${partido.id}`} className="text-xl font-bold text-white bg-gray-900 px-4 py-1 rounded-lg hover:bg-black transition shadow-md border border-gray-700">
                                            {partido.goles_local} - {partido.goles_visitante}
                                        </Link>
                                        <span className="w-2/5 text-left font-semibold text-gray-300">{partido.nombre_visitante}</span>
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl p-6">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Ligas</h3>
                            <ul className="space-y-3">
                                {ligas.length > 0 ? (
                                    ligas.map(liga => (
                                        <li key={liga.id}>
                                            <Link to={`/ligas/${liga.id}`} className="text-indigo-400 hover:text-indigo-300 font-bold text-lg">
                                                {liga.nombre}
                                            </Link>
                                        </li>
                                    ))
                                ) : <p className="text-gray-500">No hay ligas activas.</p>}
                            </ul>
                        </div>
                        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-xl p-6">
                            <h3 className="text-2xl font-bold text-cyan-400 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Mercado</h3>
                            <ScrollingTicker 
                                items={ultimosFichajes}
                                heightClass="h-48"
                                renderItem={(fichaje) => (
                                    <div className="text-sm p-2">
                                        <p className="font-bold text-white">{fichaje.jugador_nombre}</p>
                                        <p className="text-gray-400">{fichaje.equipo_origen || 'Agente Libre'} → <span className="font-semibold text-cyan-400">{fichaje.equipo_destino}</span></p>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HomePage;

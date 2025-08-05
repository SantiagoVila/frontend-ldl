import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminLigasPage() {
    const [ligas, setLigas] = useState([]);
    const [copas, setCopas] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // --- Estados para el formulario ---
    const [tipoCompeticion, setTipoCompeticion] = useState('liga');
    const [nombre, setNombre] = useState('');
    const [temporada, setTemporada] = useState('');
    const [categoria, setCategoria] = useState('1');
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fechaArranque, setFechaArranque] = useState(new Date().toISOString().split('T')[0]);
    const [diasDeJuego, setDiasDeJuego] = useState([]);
    const [jornadasPorDia, setJornadasPorDia] = useState(1); // Nuevo estado para jornadas por día

    // --- Carga de datos inicial ---
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [ligasRes, copasRes, equiposRes] = await Promise.all([
                api.get('/ligas', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/copas', { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/equipos?estado=aprobado&limit=200', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setLigas(ligasRes.data);
            setCopas(copasRes.data);
            setEquiposDisponibles(equiposRes.data.equipos || equiposRes.data);
        } catch (err) {
            toast.error('Error al cargar los datos iniciales.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleCrearCompeticion = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }

        const payloadEquipos = equiposSeleccionados.map(id => {
            const equipo = equiposDisponibles.find(e => e.id === id);
            return { id: equipo.id, nombre: equipo.nombre };
        });

        if (tipoCompeticion === 'liga' && payloadEquipos.length < 2) {
             setFormError('Debes seleccionar al menos 2 equipos para una liga.');
             return;
        }

        if (tipoCompeticion === 'copa') {
            if (payloadEquipos.length < 4) {
                setFormError('Para una copa con grupos, necesitas al menos 4 equipos.');
                return;
            }
            if (payloadEquipos.length % 2 !== 0) {
                setFormError(`El número de equipos para la copa debe ser par. Has seleccionado ${payloadEquipos.length}.`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const endpoint = tipoCompeticion === 'liga' ? '/ligas' : '/copas';
            const payload = {
            nombre,
            temporada,
            fecha_arranque: fechaArranque,
            dias_de_juego: diasDeJuego,
            jornadas_por_dia: jornadasPorDia,
            equipos: payloadEquipos,
            ...(tipoCompeticion === 'liga' && { categoria }),
        };

            const response = await api.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`¡${tipoCompeticion.charAt(0).toUpperCase() + tipoCompeticion.slice(1)} creada con éxito!`);
            
            fetchData(); // Recargamos todos los datos para que las listas se actualicen

            // Limpiar formulario
            setNombre('');
            setTemporada('');
            setEquiposSeleccionados([]);
            setSearchTerm('');
            setFechaArranque(new Date().toISOString().split('T')[0]);
            setDiasDeJuego([]);

        } catch (err) {
            toast.error(err.response?.data?.error || `Error al crear la ${tipoCompeticion}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleBorrarLiga = async (ligaId, ligaNombre) => {
        if (!window.confirm(`¿Seguro que quieres borrar la liga "${ligaNombre}"?`)) return;
        try {
            await api.delete(`/ligas/${ligaId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Liga eliminada');
            setLigas(prev => prev.filter(l => l.id !== ligaId));
        } catch (err) {
            toast.error('Error al borrar la liga');
        }
    };

    const handleBorrarCopa = async (copaId, copaNombre) => {
        if (!window.confirm(`¿Seguro que quieres borrar la copa "${copaNombre}"?`)) return;
        try {
            await api.delete(`/copas/${copaId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Copa eliminada');
            setCopas(prev => prev.filter(c => c.id !== copaId));
        } catch (err) {
            toast.error('Error al borrar la copa');
        }
    };
    
    const handleSelectEquipo = (equipoId) => setEquiposSeleccionados(prev => [...prev, equipoId]);
    const handleDeselectEquipo = (equipoId) => setEquiposSeleccionados(prev => prev.filter(id => id !== equipoId));
    
    const handleDiaChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setDiasDeJuego(prev => [...prev, value]);
        } else {
            setDiasDeJuego(prev => prev.filter(dia => dia !== value));
        }
    };

    const equiposFiltrados = useMemo(() => equiposDisponibles.filter(e => !equiposSeleccionados.includes(e.id) && e.nombre.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, equiposDisponibles, equiposSeleccionados]);
    const equiposElegidos = useMemo(() => equiposDisponibles.filter(e => equiposSeleccionados.includes(e.id)), [equiposSeleccionados, equiposDisponibles]);

    const labelClass = "block text-sm font-medium text-gray-300";
    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500";

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8">Gestión de Competiciones</h2>
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-medium text-cyan-400">Crear Nueva Competición</h3>
                <form onSubmit={handleCrearCompeticion} className="mt-4 space-y-6">
                    <div>
                        <label className={labelClass}>Tipo</label>
                        <div className="flex items-center space-x-4 mt-2">
                            <label className="flex items-center text-white cursor-pointer"><input type="radio" value="liga" checked={tipoCompeticion === 'liga'} onChange={() => setTipoCompeticion('liga')} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Liga</span></label>
                            <label className="flex items-center text-white cursor-pointer"><input type="radio" value="copa" checked={tipoCompeticion === 'copa'} onChange={() => setTipoCompeticion('copa')} className="form-radio h-4 w-4 text-cyan-600"/> <span className="ml-2">Copa</span></label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label htmlFor="nombre" className={labelClass}>Nombre</label><input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClass} /></div>
                        <div><label htmlFor="temporada" className={labelClass}>Temporada</label><input type="text" id="temporada" value={temporada} onChange={(e) => setTemporada(e.target.value)} placeholder="Ej: 2025" className={inputClass} /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fecha_arranque" className={labelClass}>Fecha de Arranque</label>
                            <input type="date" id="fecha_arranque" value={fechaArranque} onChange={(e) => setFechaArranque(e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Días de Juego</label>
                            <div className="flex items-center space-x-3 mt-2 text-white text-sm">
                                {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(dia => (
                                    <label key={dia} className="flex items-center">
                                        <input type="checkbox" value={dia.toLowerCase()} checked={diasDeJuego.includes(dia.toLowerCase())} onChange={handleDiaChange} className="form-checkbox h-4 w-4 text-cyan-600 rounded"/>
                                        <span className="ml-1">{dia.substring(0, 3)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {tipoCompeticion === 'liga' && (<div><label htmlFor="categoria" className={labelClass}>Categoría</label><select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>{[1, 2, 3, 4].map(cat => <option key={cat} value={cat}>Categoría {cat}</option>)}</select></div>)}
                        <div>
                            <label htmlFor="jornadas_por_dia" className={labelClass}>Jornadas por Día</label>
                            <input
                                type="number"
                                id="jornadas_por_dia"
                                min="1"
                                value={jornadasPorDia}
                                onChange={(e) => setJornadasPorDia(Number(e.target.value))}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className={labelClass}>Seleccionar Equipos ({equiposSeleccionados.length})</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="bg-gray-700 p-3 rounded-md"><input type="text" placeholder="Buscar equipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-2 py-1 bg-gray-800 rounded-md text-white mb-2" /><ul className="max-h-60 overflow-y-auto space-y-1">{equiposFiltrados.map(equipo => (<li key={equipo.id} onClick={() => handleSelectEquipo(equipo.id)} className="text-white text-sm p-2 rounded-md cursor-pointer hover:bg-cyan-600">{equipo.nombre}</li>))}</ul></div>
                            <div className="bg-gray-700 p-3 rounded-md"><h4 className="text-gray-400 text-sm font-bold mb-2">Seleccionados</h4><ul className="max-h-60 overflow-y-auto space-y-1">{equiposElegidos.map(equipo => (<li key={equipo.id} onClick={() => handleDeselectEquipo(equipo.id)} className="flex justify-between items-center text-white text-sm p-2 rounded-md cursor-pointer hover:bg-red-600"><span>{equipo.nombre}</span><span className="text-xs text-red-300">Quitar</span></li>))}</ul></div>
                        </div>
                    </div>

                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="text-right"><button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">{isSubmitting ? 'Creando...' : 'Crear Competición'}</button></div>
                </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800/50 p-6 rounded-lg"><h3 className="text-lg font-medium text-cyan-400">Ligas Existentes</h3><ul className="divide-y divide-gray-700 mt-4">{ligas.map(liga => (<li key={liga.id} className="py-2 flex justify-between items-center"><Link to={`/admin/ligas/${liga.id}`} className="text-indigo-400 hover:text-indigo-300">{liga.nombre} ({liga.temporada || 'N/A'})</Link><button onClick={() => handleBorrarLiga(liga.id, liga.nombre)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Borrar</button></li>))}</ul></div>
                <div className="bg-gray-800/50 p-6 rounded-lg"><h3 className="text-lg font-medium text-cyan-400">Copas Existentes</h3><ul className="divide-y divide-gray-700 mt-4">{copas.map(copa => (<li key={copa.id} className="py-2 flex justify-between items-center"><Link to={`/admin/copas/${copa.id}`} className="text-indigo-400 hover:text-indigo-300">{copa.nombre} ({copa.temporada || 'N/A'})</Link><button onClick={() => handleBorrarCopa(copa.id, copa.nombre)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Borrar</button></li>))}</ul></div>
            </div>
        </div>
    );
}

export default AdminLigasPage;

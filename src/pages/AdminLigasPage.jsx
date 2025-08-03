import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/api';

function AdminLigasPage() {
    const [ligas, setLigas] = useState([]); // Esto podría incluir copas en el futuro
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    // --- Estados para el nuevo formulario ---
    const [tipoCompeticion, setTipoCompeticion] = useState('liga'); // 'liga' o 'copa'
    const [nombre, setNombre] = useState('');
    const [temporada, setTemporada] = useState('');
    const [categoria, setCategoria] = useState('1');
    const [equiposDisponibles, setEquiposDisponibles] = useState([]);
    const [equiposSeleccionados, setEquiposSeleccionados] = useState([]);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Carga de datos inicial ---
    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const [ligasRes, equiposRes] = await Promise.all([
                    api.get('/ligas', { headers: { Authorization: `Bearer ${token}` } }),
                    api.get('/equipos?estado=aprobado')
                ]);
                setLigas(ligasRes.data);
                setEquiposDisponibles(equiposRes.data);
            } catch (err) {
                toast.error('Error al cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleSeleccionEquipo = (equipoId) => {
        setEquiposSeleccionados(prev => 
            prev.includes(equipoId) ? prev.filter(id => id !== equipoId) : [...prev, equipoId]
        );
    };
    
    const esPotenciaDeDos = (n) => n > 0 && (n & (n - 1)) === 0;

    const handleCrearCompeticion = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!nombre.trim()) {
            setFormError('El nombre es obligatorio.');
            return;
        }
        if (equiposSeleccionados.length < 2) {
            setFormError('Debes seleccionar al menos 2 equipos.');
            return;
        }
        if (tipoCompeticion === 'copa' && !esPotenciaDeDos(equiposSeleccionados.length)) {
            setFormError(`Para una copa, el número de equipos debe ser una potencia de 2 (4, 8, 16). Has seleccionado ${equiposSeleccionados.length}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            let endpoint = '';
            let payload = {};

            if (tipoCompeticion === 'liga') {
                endpoint = '/ligas';
                payload = { nombre, temporada, categoria };
            } else { // Es copa
                endpoint = '/copas';
                payload = { nombre, temporada, equipos: equiposSeleccionados.map(id => ({ id })) };
            }

            const response = await api.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`¡${tipoCompeticion.charAt(0).toUpperCase() + tipoCompeticion.slice(1)} creada con éxito!`);
            // Aquí podrías recargar la lista de competiciones
            setNombre('');
            setTemporada('');
            setEquiposSeleccionados([]);

        } catch (err) {
            toast.error(err.response?.data?.error || `Error al crear la ${tipoCompeticion}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8">Gestión de Competiciones</h2>

            {/* FORMULARIO DE CREACIÓN */}
            <div className="bg-gray-800/50 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-medium text-cyan-400">Crear Nueva Competición</h3>
                <form onSubmit={handleCrearCompeticion} className="mt-4 space-y-6">
                    {/* Tipo de Competición */}
                    <div>
                        <label className={labelClass}>Tipo</label>
                        <div className="flex items-center space-x-4 mt-2">
                            <label className="flex items-center text-white"><input type="radio" value="liga" checked={tipoCompeticion === 'liga'} onChange={() => setTipoCompeticion('liga')} /> <span className="ml-2">Liga</span></label>
                            <label className="flex items-center text-white"><input type="radio" value="copa" checked={tipoCompeticion === 'copa'} onChange={() => setTipoCompeticion('copa')} /> <span className="ml-2">Copa</span></label>
                        </div>
                    </div>
                    
                    {/* Campos Comunes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nombre" className={labelClass}>Nombre</label>
                            <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="temporada" className={labelClass}>Temporada</label>
                            <input type="text" id="temporada" value={temporada} onChange={(e) => setTemporada(e.target.value)} className={inputClass} />
                        </div>
                    </div>

                    {/* Campo solo para Ligas */}
                    {tipoCompeticion === 'liga' && (
                        <div>
                            <label htmlFor="categoria" className={labelClass}>Categoría</label>
                            <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className={inputClass}>
                                {[1, 2, 3, 4].map(cat => <option key={cat} value={cat}>Categoría {cat}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Selección de Equipos (solo para Copas) */}
                    {tipoCompeticion === 'copa' && (
                         <div>
                            <label className={labelClass}>Seleccionar Equipos ({equiposSeleccionados.length} seleccionados)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 bg-gray-700 p-4 rounded-md max-h-60 overflow-y-auto">
                                {equiposDisponibles.map(equipo => (
                                    <label key={equipo.id} className="flex items-center text-white cursor-pointer">
                                        <input type="checkbox" checked={equiposSeleccionados.includes(equipo.id)} onChange={() => handleSeleccionEquipo(equipo.id)} />
                                        <span className="ml-3">{equipo.nombre}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    
                    <div className="text-right">
                        <button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg">
                            {isSubmitting ? 'Creando...' : 'Crear Competición'}
                        </button>
                    </div>
                </form>
            </div>
            
            {/* LISTA DE LIGAS EXISTENTES (podríamos añadir copas aquí más adelante) */}
            <div className="bg-gray-800/50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-cyan-400">Ligas Existentes</h3>
                <ul className="divide-y divide-gray-700 mt-4">
                    {ligas.map(liga => (
                        <li key={liga.id} className="py-2">
                            <Link to={`/admin/ligas/${liga.id}`} className="text-indigo-400 hover:text-indigo-300">{liga.nombre} ({liga.temporada})</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default AdminLigasPage;

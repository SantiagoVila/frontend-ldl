import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BotonVolver from '../components/ui/BotonVolver';

function AdminUsuarioDetailPage() {
    const [usuario, setUsuario] = useState(null);
    const [equipos, setEquipos] = useState([]);
    const [sanciones, setSanciones] = useState([]);
    const [nuevaSancion, setNuevaSancion] = useState({ motivo: '', partidos_de_sancion: '1' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { id: usuarioId } = useParams();
    const { token } = useAuth();

    // Función para obtener todos los datos de la página
    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [usuarioRes, equiposRes, sancionesRes] = await Promise.all([
                api.get(`/usuarios/${usuarioId}`, { headers: { Authorization: `Bearer ${token}` } }),
                api.get('/equipos', { headers: { Authorization: `Bearer ${token}` } }),
                api.get(`/admin/usuarios/${usuarioId}/sanciones`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setUsuario(usuarioRes.data);
            setEquipos(equiposRes.data.equipos || equiposRes.data); // Compatible con respuestas paginadas o no
            setSanciones(sancionesRes.data);

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Error al cargar los datos del usuario.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false); // Esto es crucial para que la página deje de cargar
        }
    };

    // useEffect para llamar a fetchData cuando el componente se carga
    useEffect(() => {
        fetchData();
    }, [usuarioId, token]);

    const handleRolChange = async (newRol) => {
        try {
            await api.put(`/usuarios/${usuarioId}/rol`,
                { nuevoRol: newRol }, // El backend espera 'nuevoRol'
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Rol actualizado con éxito.');
            fetchData(); // Recargamos los datos para ver los cambios
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cambiar el rol.');
        }
    };

    const handleEquipoChange = async (e) => {
        const nuevoEquipoId = e.target.value || null;
        try {
            await api.put(`/usuarios/${usuarioId}/equipo`,
                { nuevoEquipoId: nuevoEquipoId }, // El backend espera 'nuevoEquipoId'
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Equipo actualizado con éxito.');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al cambiar el equipo.');
        }
    };
    
    const handleSancionChange = (e) => {
        setNuevaSancion({ ...nuevaSancion, [e.target.name]: e.target.value });
    };

    const handleAplicarSancion = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/sanciones', {
                jugador_id: usuarioId,
                motivo: nuevaSancion.motivo,
                partidos_de_sancion: nuevaSancion.partidos_de_sancion
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success('¡Sanción aplicada con éxito!');
            setNuevaSancion({ motivo: '', partidos_de_sancion: '1' });
            fetchData(); // Recargamos para ver la nueva sanción en la lista
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al aplicar la sanción.');
        }
    };

    if (loading) return <p className="text-center p-8 text-gray-400">Cargando...</p>;
    if (error) return <p className="text-center p-8 text-red-500">{error}</p>;
    if (!usuario) return <p className="text-center p-8">No se encontró el usuario.</p>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <BotonVolver />

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
                    <h2 className="text-2xl font-bold">Detalle del Usuario</h2>
                    <p className="mt-1 text-sm text-gray-300">Gestiona la información y permisos de {usuario.nombre_in_game}.</p>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-6">
                    {/* Información Básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-300">Información de Contacto</h4>
                            <p className="text-white">{usuario.email}</p>
                        </div>
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-300">Equipo Actual</h4>
                            <p className="text-white">{usuario.equipo_nombre || 'Sin equipo'}</p>
                        </div>
                    </div>

                    {/* Gestión de Rol y Equipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-gray-300">Rol del Usuario</label>
                            <select id="rol" value={usuario.rol} onChange={(e) => handleRolChange(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm">
                                <option value="jugador">Jugador</option>
                                <option value="dt">DT</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="equipo" className="block text-sm font-medium text-gray-300">Asignar a Equipo</label>
                            <select id="equipo" value={usuario.equipo_id || ""} onChange={handleEquipoChange} className="mt-1 block w-full pl-3 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm">
                                <option value="">-- Sin Equipo --</option>
                                {equipos.map(equipo => (
                                    <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gestión de Sanciones (solo para jugadores) */}
            {usuario.rol === 'jugador' && (
                <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-800 text-white">
                        <h3 className="text-lg leading-6 font-medium">Gestión de Sanciones</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <form onSubmit={handleAplicarSancion} className="space-y-4">
                            <div>
                                <label htmlFor="motivo" className="block text-sm font-medium text-gray-300">Motivo de la Sanción</label>
                                <textarea id="motivo" name="motivo" value={nuevaSancion.motivo} onChange={handleSancionChange} required rows={3} className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"/>
                            </div>
                            <div>
                                <label htmlFor="partidos_de_sancion" className="block text-sm font-medium text-gray-300">Partidos de Suspensión</label>
                                <input type="number" id="partidos_de_sancion" name="partidos_de_sancion" value={nuevaSancion.partidos_de_sancion} onChange={handleSancionChange} min="1" required className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"/>
                            </div>
                            <div className="text-right">
                                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                                    Aplicar Sanción
                                </button>
                            </div>
                        </form>
                        
                        <div className="mt-6">
                            <h4 className="text-md font-medium text-white">Historial de Sanciones</h4>
                            {sanciones.length > 0 ? (
                                <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-700">
                                        <thead className="bg-gray-800">
                                            <tr>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Fecha</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Motivo</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Sanción</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-white">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700 bg-gray-900/50">
                                            {sanciones.map(s => (
                                                <tr key={s.id}>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{new Date(s.fecha_creacion).toLocaleDateString()}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{s.motivo}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{s.partidos_de_sancion} partidos</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.estado === 'activa' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                                            {s.estado}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-gray-500">Este jugador no tiene sanciones.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminUsuarioDetailPage;

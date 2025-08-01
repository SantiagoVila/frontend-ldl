import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function DtCrearEquipoPage() {
    const [nombre, setNombre] = useState('');
    const [escudo, setEscudo] = useState(null); // ✅ CAMBIO: Ahora guarda el archivo, no una URL
    const [formacion, setFormacion] = useState('4-4-2');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setEscudo(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // ✅ CAMBIO: Usamos FormData para enviar el archivo y los datos
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('formacion', formacion);
        if (escudo) {
            formData.append('escudo', escudo);
        }

        try {
            await api.post('/equipos/crear', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', // Esencial para subir archivos
                    Authorization: `Bearer ${token}` 
                }
            });
            toast.success('¡Solicitud de equipo enviada con éxito! Un admin la revisará.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al crear el equipo.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-cyan-800";

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Crear mi Nuevo Equipo</h2>
                    <p className="mt-2 text-sm text-gray-400">
                        Completa los datos para enviar tu solicitud de creación de club a los administradores.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="nombre" className={labelClass}>Nombre del Equipo</label>
                        <input id="nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} required className={inputClass} placeholder="Ej: Dragones FC" />
                    </div>
                    
                    {/* ✅ CAMBIO: El campo de texto se reemplaza por un campo de subida de archivo */}
                    <div>
                        <label htmlFor="escudo" className={labelClass}>Escudo del Equipo (Opcional)</label>
                        <input 
                            id="escudo" 
                            type="file" 
                            onChange={handleFileChange} 
                            accept="image/png, image/jpeg"
                            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-cyan-400 hover:file:bg-gray-600"
                        />
                    </div>

                    <div>
                        <label htmlFor="formacion" className={labelClass}>Formación Preferida</label>
                        <select id="formacion" value={formacion} onChange={e => setFormacion(e.target.value)} className={inputClass}>
                            <option value="4-4-2">4-4-2</option>
                            <option value="4-3-3">4-3-3</option>
                            <option value="3-5-2">3-5-2</option>
                            <option value="5-3-2">5-3-2</option>
                        </select>
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={loading} className={buttonClass}>
                            {loading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Creación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DtCrearEquipoPage;

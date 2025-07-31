import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

function AdminCrearNoticiaPage() {
    const [titulo, setTitulo] = useState('');
    const [contenido, setContenido] = useState('');
    const [imagen, setImagen] = useState(null); // ✅ Nuevo estado para el archivo de imagen
    const [loading, setLoading] = useState(false);

    const { token } = useAuth();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setImagen(e.target.files[0]);
    };

    const handleCrearNoticia = async (e) => {
        e.preventDefault();
        setLoading(true);

        // ✅ Se usa FormData para poder enviar texto e imagen juntos
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('contenido', contenido);
        if (imagen) {
            formData.append('imagen', imagen);
        }

        try {
            await api.post('/noticias', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', // Esencial para subir archivos
                    Authorization: `Bearer ${token}` 
                }
            });

            toast.success('¡Noticia publicada con éxito!');
            navigate('/');

        } catch (err) {
            toast.error(err.response?.data?.error || 'No se pudo publicar la noticia.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm";
    const labelClass = "block text-sm font-medium text-gray-300";
    const buttonClass = "inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-cyan-800";

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white" style={{fontFamily: 'var(--font-heading)'}}>Crear Nueva Noticia</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Publica anuncios y comunicados para todos los usuarios.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 shadow-lg rounded-lg p-6">
                <form onSubmit={handleCrearNoticia} className="space-y-6">
                    <div>
                        <label htmlFor="titulo" className={labelClass}>Título</label>
                        <input type="text" name="titulo" id="titulo" className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                    </div>
                    
                    {/* ✅ NUEVO CAMPO PARA SUBIR IMAGEN */}
                    <div>
                        <label htmlFor="imagen" className={labelClass}>Imagen (Opcional)</label>
                        <input
                            type="file"
                            name="imagen"
                            id="imagen"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg"
                            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-cyan-400 hover:file:bg-gray-600"
                        />
                    </div>

                    <div>
                        <label htmlFor="contenido" className={labelClass}>Contenido</label>
                        <textarea id="contenido" name="contenido" rows={10} className={inputClass} value={contenido} onChange={(e) => setContenido(e.target.value)} required />
                    </div>

                    <div className="pt-5">
                        <div className="flex justify-end">
                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? 'Publicando...' : 'Publicar Noticia'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminCrearNoticiaPage;

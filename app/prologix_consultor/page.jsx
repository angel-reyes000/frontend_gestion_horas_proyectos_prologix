import styles from '../../styles/prologix_usuarios/prologix_consultor.module.scss';
import { FaClock, FaArrowTrendUp, FaBorderAll } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa";
import Image from 'next/image';
import Logo from '../../public/logo.png';
import GraficaHorasSemana from '../components/grafica_horas_semana';
import GraficaHorasProyectosSemana from '../components/grafica_horas_proyectos_semana';

export default function PrologixConsultor () {
    return (
        <>
            <div className={styles.vista_consultor}>
                <div className={styles.vista_consultor_encabezado}>
                    <div className={styles.encabezado_titulo}>
                      <h1>Mis Horas</h1>
                        <p>Registra y gestiona las horas que trabajas en tus proyectos</p>  
                    </div>
                    <div className={styles.encabezado_imagen}>
                        <div className={styles.encabezado_select}>
                            <FaClock size={40} />
                            <select>
                                <option>Todos los Proyectos</option>
                                <option>Proyecto 1</option>
                                <option>Proyecto 2</option>
                            </select>
                        </div>
                        <Image src={Logo} width={200} height={200} />
                    </div>
                </div>
                <div className={styles.vista_consultor_recuadros}>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(219, 199, 255)'}}>
                            <FaClock size={30} style={{color: 'rgb(166, 118, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Horas esta semana</p>
                            <h2>24.5</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(255, 223, 147)'}}>
                            <FaArrowTrendUp size={30} style={{color: 'rgb(255, 128, 37)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Promedio diario</p>
                            <h2>24.5</h2>
                        </div>
                    </div>
                    <div className={styles.recuadros}>
                        <div className={styles.recuadros_icono} style={{backgroundColor: 'rgb(186, 191, 255)'}}>
                            <FaBorderAll size={30} style={{color: 'rgb(37, 52, 255)'}}/>
                        </div>
                        <div className={styles.recuadros_texto}>
                            <p>Total de proyectos</p>
                            <h2>5</h2>
                        </div>
                    </div>
                </div>
                <div className={styles.vista_consultor_graficas}>
                    <div className={styles.graficas_lineas}>
                        <GraficaHorasSemana />
                    </div>
                    <div className={styles.graficas_pastel}>
                        <GraficaHorasProyectosSemana />
                    </div>
                </div>
                <div className={styles.vista_consultor_tabla}>
                    <div className={styles.vista_consultor_tabla_encabezado}>
                        <div className={styles.vista_consultor_titulo}>
                             <h1>Registro de mis horas</h1>
                        </div>
                        <div className={styles.vista_consultor_acciones}>
                            <div className={styles.acciones_select}>
                                <label>
                                    Semana:
                                    <select>
                                        <option>21</option>
                                        <option>37</option>
                                        <option>43</option>
                                    </select>
                                </label>
                            </div>
                            <div className={styles.acciones_input}>
                                <input placeholder='Buscar...'/>
                            </div>
                            <div className={styles.acciones_boton}>
                                <button><FaPlus style={{display: 'inline', marginRight: '2%'}}/>Registrar horas</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.tabla}>
                        <table>
                            <thead>
                                <tr>
                                    <th>N°Factura</th>
                                    <th>Proyecto</th>
                                    <th>Empresa</th>
                                    <th>Semana</th>
                                    <th>Fecha</th>
                                    <th>Horas</th>
                                    <th>Descripcion</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>N°Factura</td>
                                    <td>Proyecto</td>
                                    <td>Empresa</td>
                                    <td>Semana</td>
                                    <td>Fecha</td>
                                    <td>Horas</td>
                                    <td>Descripcion</td>
                                </tr>
                                <tr>
                                    <td>N°Factura</td>
                                    <td>Proyecto</td>
                                    <td>Empresa</td>
                                    <td>Semana</td>
                                    <td>Fecha</td>
                                    <td>Horas</td>
                                    <td>Descripcion</td>
                                </tr>
                                <tr>
                                    <td>N°Factura</td>
                                    <td>Proyecto</td>
                                    <td>Empresa</td>
                                    <td>Semana</td>
                                    <td>Fecha</td>
                                    <td>Horas</td>
                                    <td>Descripcion</td>
                                </tr>
                            </tbody>
                        </table> 
                    </div>
                    
                </div>
            </div>
        </>
    )
}
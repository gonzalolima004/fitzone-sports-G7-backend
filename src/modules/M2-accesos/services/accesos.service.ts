import {
    Injectable,
    ForbiddenException,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { AccesosRepository } from '../repositories/accesos.repository';
import { QrService } from './qr.service';
//import { MembresiasService } from '../../M1-usuarios/services/membresias.service';
import { ValidarIngresoDto } from '../dto/validar-ingreso.dto';
import { AccesoResponseDto } from '../dto/acceso-response.dto';

@Injectable()
export class AccesosService {
    constructor(
        private readonly accesosRepository: AccesosRepository,
        private readonly qrService: QrService,
        //private readonly membresiasService: MembresiasService,
    ) { }

    //async validarYRegistrarIngreso(
    //  validarIngresoDto: ValidarIngresoDto,
    //): Promise<AccesoResponseDto> {
    //  const { qrToken, id_sede } = validarIngresoDto;

    // 1. Descifrar y validar la ventana de vigencia del token QR (<60s)
    //const payload = this.qrService.validarTokenQr(qrToken);
    //if (!payload || !payload.id_usuario) {
    //  throw new UnauthorizedException('Token QR inválido o expirado.');
    //}

    //const id_usuario = payload.id_usuario;

    // 2. Control Anti-Doble Ingreso Simultáneo (RN-01)
    //const accesoActivo = await this.accesosRepository.buscarAccesoActivoPorUsuario(id_usuario);
    //if (accesoActivo) {
    //  throw new ConflictException(
    //    `El usuario ya registra un ingreso activo en la sede ${accesoActivo.id_sede} sin marcar egreso.`,
    //  );
    //}

    // 3. Corroborar el estado de la membresía del socio
    //const estadoMembresia = await this.membresiasService.verificarEstadoMembresia(id_usuario);
    //if (!estadoMembresia.esSocioActivo || estadoMembresia.enMora) {
    //  throw new ForbiddenException(
    //    'Acceso denegado: La membresía del usuario no se encuentra activa o está en mora.',
    //  );
    //}

    // 4. Persistir la entrada en la base de datos
    //const registro = await this.accesosRepository.crearIngreso(id_usuario, id_sede);

    //const nombreCompleto = `${registro.usuario.nombre} ${registro.usuario.apellido}`;

    //return new AccesoResponseDto(
    //  registro.id_registro_acceso,
    //  nombreCompleto,
    //  true,
    //  registro.fecha_ingreso,
    //);
    //}
}
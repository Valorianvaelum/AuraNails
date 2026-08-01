from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from aplicaciones.caja.models import Caja, GastoCaja, MovimientoCaja
from aplicaciones.caja.services import (
    abrir_caja,
    cerrar_caja,
    registrar_gasto,
    registrar_movimiento,
)
from aplicaciones.clientas.models import Clienta
from aplicaciones.cobros.models import Cobro
from aplicaciones.cobros.services import crear_cobro
from aplicaciones.servicios.models import Servicio
from aplicaciones.turnos.models import Turno, TurnoServicio


DEMO_EMAIL = "demo.auranails@example.com"
DEMO_PREFIX = "DEMO-AURANAILS"


class Command(BaseCommand):
    help = (
        "Crea una cuenta y un conjunto aislado de datos demostrativos. "
        "Nunca modifica datos pertenecientes a otros usuarios."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            help=(
                "Contraseña para la cuenta demo. También puede definirse mediante "
                "AURANAILS_DEMO_PASSWORD."
            ),
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help=(
                "Elimina y vuelve a crear exclusivamente los datos pertenecientes "
                f"a {DEMO_EMAIL}."
            ),
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options.get("password") or os.getenv("AURANAILS_DEMO_PASSWORD")
        if not password:
            raise CommandError(
                "Indicá --password o definí AURANAILS_DEMO_PASSWORD. "
                "La contraseña no se guarda en el repositorio."
            )

        User = get_user_model()
        demo_user = User.objects.filter(email=DEMO_EMAIL).first()

        if demo_user and not options["reset"]:
            raise CommandError(
                f"La cuenta {DEMO_EMAIL} ya existe. "
                "Usá --reset para reconstruir únicamente sus datos demo."
            )

        if demo_user:
            self._limpiar_datos_demo(demo_user)
            demo_user.nombre = "Maia"
            demo_user.apellido = "Demostración"
            demo_user.telefono = "3874000000"
            demo_user.is_active = True
            demo_user.set_password(password)
            demo_user.save()
        else:
            demo_user = User.objects.create_user(
                email=DEMO_EMAIL,
                password=password,
                nombre="Maia",
                apellido="Demostración",
                telefono="3874000000",
                is_active=True,
            )

        clientas = self._crear_clientas(demo_user)
        servicios = self._crear_servicios(demo_user)

        ahora = timezone.localtime()
        caja_historica = self._crear_jornada_historica(
            propietaria=demo_user,
            clientas=clientas,
            servicios=servicios,
            ahora=ahora,
        )
        caja_actual = self._crear_jornada_actual(
            propietaria=demo_user,
            clientas=clientas,
            servicios=servicios,
            ahora=ahora,
        )

        self.stdout.write(self.style.SUCCESS("Demo de AuraNails preparada correctamente."))
        self.stdout.write(f"Cuenta: {DEMO_EMAIL}")
        self.stdout.write(
            "Datos: "
            f"{len(clientas)} clientas, {len(servicios)} servicios, "
            f"{demo_user.turnos.count()} turnos, {demo_user.cobros.count()} cobros."
        )
        self.stdout.write(
            f"Caja histórica #{caja_historica.pk} cerrada y "
            f"caja actual #{caja_actual.pk} abierta."
        )

    def _limpiar_datos_demo(self, propietaria):
        """
        El orden respeta las relaciones PROTECT.
        La consulta siempre queda limitada a la propietaria demo exacta.
        """
        Cobro.objects.filter(propietaria=propietaria).delete()
        GastoCaja.objects.filter(caja__propietaria=propietaria).delete()
        MovimientoCaja.objects.filter(caja__propietaria=propietaria).delete()
        Caja.objects.filter(propietaria=propietaria).delete()
        TurnoServicio.objects.filter(turno__propietaria=propietaria).delete()
        Turno.objects.filter(propietaria=propietaria).delete()
        Clienta.objects.filter(propietaria=propietaria).delete()
        Servicio.objects.filter(propietaria=propietaria).delete()

    def _crear_clientas(self, propietaria):
        datos = [
            ("Lucía", "Gómez", "3874000101", "Prefiere turnos por la tarde."),
            ("Camila", "Díaz", "3874000102", "Suele elegir tonos neutros."),
            ("Sofía", "Herrera", "3874000103", "Requiere retiro antes del servicio."),
            ("Valentina", "López", "3874000104", "Prefiere diseños minimalistas."),
            ("Martina", "Ruiz", "3874000105", "Confirmar el turno por WhatsApp."),
            ("Julieta", "Romero", "3874000106", "Le gustan los tonos bordó."),
            ("Carla", "Medina", "3874000107", "Evita fragancias intensas."),
            ("Florencia", "Torres", "3874000108", "Prefiere horarios de mañana."),
            ("Agustina", "Rojas", "3874000109", "Solicita nail art delicado."),
            ("Milagros", "Sánchez", "3874000110", "Clienta frecuente."),
        ]
        return [
            Clienta.objects.create(
                propietaria=propietaria,
                nombre=nombre,
                apellido=apellido,
                telefono=telefono,
                email=f"demo.{indice}@example.com",
                notas=f"{DEMO_PREFIX}. {nota}",
                color_favorito="Tonos neutros" if indice % 2 else "Malva",
                estilo_favorito="Minimalista",
            )
            for indice, (nombre, apellido, telefono, nota) in enumerate(datos, start=1)
        ]

    def _crear_servicios(self, propietaria):
        datos = [
            ("Semipermanente", 60, "18000.00", 10),
            ("Kapping gel", 90, "25000.00", 20),
            ("Soft gel", 120, "32000.00", 30),
            ("Esculpidas", 150, "38000.00", 40),
            ("Retiro de producto", 30, "8000.00", 50),
            ("Nail art adicional", 30, "7000.00", 60),
            ("Manicura clásica", 45, "14000.00", 70),
        ]
        return {
            nombre: Servicio.objects.create(
                propietaria=propietaria,
                nombre=nombre,
                descripcion=f"{DEMO_PREFIX}. Servicio cargado para demostración.",
                duracion_minutos=duracion,
                precio=Decimal(precio),
                orden=orden,
            )
            for nombre, duracion, precio, orden in datos
        }

    def _crear_turno(
        self,
        *,
        propietaria,
        clienta,
        inicio,
        estado,
        servicios,
        notas="",
    ):
        duracion = sum(servicio.duracion_minutos for servicio in servicios)
        precio = sum((servicio.precio for servicio in servicios), Decimal("0.00"))
        turno = Turno.objects.create(
            propietaria=propietaria,
            clienta=clienta,
            inicio=inicio,
            fin=inicio + timedelta(minutes=duracion),
            estado=estado,
            notas=f"{DEMO_PREFIX}. {notas}".strip(),
            duracion_total_minutos=duracion,
            precio_estimado=precio,
        )
        TurnoServicio.objects.bulk_create(
            [
                TurnoServicio(
                    turno=turno,
                    servicio=servicio,
                    nombre_servicio=servicio.nombre,
                    duracion_minutos=servicio.duracion_minutos,
                    precio=servicio.precio,
                    orden=orden,
                )
                for orden, servicio in enumerate(servicios)
            ]
        )
        return turno

    def _crear_jornada_historica(self, *, propietaria, clientas, servicios, ahora):
        ayer = ahora - timedelta(days=1)
        caja = abrir_caja(
            propietaria=propietaria,
            saldo_inicial=Decimal("20000.00"),
            observacion_apertura=f"{DEMO_PREFIX}. Jornada histórica.",
        )

        turno_1 = self._crear_turno(
            propietaria=propietaria,
            clienta=clientas[0],
            inicio=ayer.replace(hour=10, minute=0, second=0, microsecond=0),
            estado=Turno.Estado.REALIZADO,
            servicios=[servicios["Semipermanente"]],
        )
        turno_2 = self._crear_turno(
            propietaria=propietaria,
            clienta=clientas[1],
            inicio=ayer.replace(hour=12, minute=0, second=0, microsecond=0),
            estado=Turno.Estado.REALIZADO,
            servicios=[servicios["Kapping gel"]],
        )
        self._crear_turno(
            propietaria=propietaria,
            clienta=clientas[6],
            inicio=ayer.replace(hour=15, minute=30, second=0, microsecond=0),
            estado=Turno.Estado.CANCELADO,
            servicios=[servicios["Manicura clásica"]],
        )
        self._crear_turno(
            propietaria=propietaria,
            clienta=clientas[7],
            inicio=ayer.replace(hour=17, minute=0, second=0, microsecond=0),
            estado=Turno.Estado.NO_VINO,
            servicios=[servicios["Retiro de producto"]],
        )

        crear_cobro(
            propietaria=propietaria,
            turno_id=turno_1.pk,
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )
        crear_cobro(
            propietaria=propietaria,
            turno_id=turno_2.pk,
            metodo_pago=Cobro.MetodoPago.TRANSFERENCIA,
            detalle_metodo="Transferencia bancaria demo",
        )
        registrar_gasto(
            propietaria=propietaria,
            caja_id=caja.pk,
            concepto="Reposición de insumos",
            importe=Decimal("8500.00"),
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
            observacion=f"{DEMO_PREFIX}. Compra demostrativa.",
        )
        registrar_movimiento(
            propietaria=propietaria,
            caja_id=caja.pk,
            tipo=MovimientoCaja.Tipo.RETIRO,
            importe=Decimal("15000.00"),
            motivo=f"{DEMO_PREFIX}. Retiro demostrativo.",
        )
        caja = cerrar_caja(
            propietaria=propietaria,
            caja_id=caja.pk,
            saldo_contado=Decimal("14500.00"),
        )

        marca_historica = ayer.replace(hour=20, minute=0, second=0, microsecond=0)
        Caja.objects.filter(pk=caja.pk).update(
            abierta_en=ayer.replace(hour=8, minute=45, second=0, microsecond=0),
            cerrada_en=marca_historica,
            creado_en=ayer.replace(hour=8, minute=45, second=0, microsecond=0),
            actualizado_en=marca_historica,
        )
        Cobro.objects.filter(caja=caja).update(
            creado_en=ayer.replace(hour=13, minute=45, second=0, microsecond=0),
            actualizado_en=ayer.replace(hour=13, minute=45, second=0, microsecond=0),
        )
        GastoCaja.objects.filter(caja=caja).update(
            registrado_en=ayer.replace(hour=16, minute=0, second=0, microsecond=0)
        )
        MovimientoCaja.objects.filter(caja=caja).update(
            registrado_en=ayer.replace(hour=19, minute=0, second=0, microsecond=0)
        )
        caja.refresh_from_db()
        return caja

    def _crear_jornada_actual(self, *, propietaria, clientas, servicios, ahora):
        caja = abrir_caja(
            propietaria=propietaria,
            saldo_inicial=Decimal("20000.00"),
            observacion_apertura=f"{DEMO_PREFIX}. Caja preparada para la demo.",
        )

        inicio_realizado = ahora - timedelta(hours=2)
        turno_realizado = self._crear_turno(
            propietaria=propietaria,
            clienta=clientas[2],
            inicio=inicio_realizado,
            estado=Turno.Estado.REALIZADO,
            servicios=[servicios["Retiro de producto"]],
            notas="Turno realizado y cobrado.",
        )
        crear_cobro(
            propietaria=propietaria,
            turno_id=turno_realizado.pk,
            metodo_pago=Cobro.MetodoPago.EFECTIVO,
        )
        registrar_movimiento(
            propietaria=propietaria,
            caja_id=caja.pk,
            tipo=MovimientoCaja.Tipo.APORTE,
            importe=Decimal("5000.00"),
            motivo=f"{DEMO_PREFIX}. Aporte para cambio.",
        )

        primer_inicio = self._redondear_media_hora(ahora + timedelta(minutes=30))
        agenda = [
            (clientas[3], Turno.Estado.CONFIRMADO, [servicios["Soft gel"]], 0),
            (clientas[4], Turno.Estado.PENDIENTE, [servicios["Manicura clásica"]], 150),
            (clientas[5], Turno.Estado.REPROGRAMADO, [servicios["Esculpidas"]], 270),
            (clientas[8], Turno.Estado.CONFIRMADO, [servicios["Semipermanente"], servicios["Nail art adicional"]], 450),
            (clientas[9], Turno.Estado.PENDIENTE, [servicios["Kapping gel"]], 600),
        ]
        for clienta, estado, servicios_turno, minutos in agenda:
            self._crear_turno(
                propietaria=propietaria,
                clienta=clienta,
                inicio=primer_inicio + timedelta(minutes=minutos),
                estado=estado,
                servicios=servicios_turno,
            )
        return caja

    @staticmethod
    def _redondear_media_hora(valor):
        valor = valor.replace(second=0, microsecond=0)
        minutos = 30 if valor.minute < 30 else 60
        redondeado = valor.replace(minute=0) + timedelta(minutes=minutos)
        return redondeado

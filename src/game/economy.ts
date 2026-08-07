import economy from '../data/economy.json'
import vehicles from '../data/vehicles.json'
import localSuppliers from '../data/local-suppliers.json'

export { economy, vehicles, localSuppliers }
export const findVehicle = (id: string) => vehicles.find(vehicle => vehicle.id === id) ?? vehicles[0]

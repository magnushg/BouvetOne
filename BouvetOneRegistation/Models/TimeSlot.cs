using System;

namespace BouvetOneRegistation.Models
{
    public class TimeSlot
    {
        public int Id { get; set; }
        public string LocationName { get; set; }
        public Session Session { get; set; }
    }

    public enum Location
    {
        Auditoriet,
        SoriaMoria,
        Akerselva,
        Lilleborg
    }
}